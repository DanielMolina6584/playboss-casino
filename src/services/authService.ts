import type {
  CompleteProfilePayload,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  User,
  VerifyCodePayload,
} from '@/types';
import { getRecaptchaToken } from '@/utils/recaptcha';
import { MOCK_GOOGLE_CREDENTIAL } from '@/config/auth';
import { getAccessToken, httpClient, setAccessToken, type ApiEnvelope } from '@/utils/httpClient';
import { currentMockUserId, isMockActive, isMockToken, mockError, mockToken, mockUserIdFromToken, withMock } from '@/services/dataSource';
import { findUserByEmail, getDb, MOCK_RECOVERY_CODE, nextId, saveDb, type MockUserRecord } from '@/mocks/store';

// ---------------------------------------------------------------------------
// Conectado a la API real de playboss (Laravel + Sanctum), con caída a mock
// (ver services/dataSource). La API trabaja en español (correo, contrasena,
// primer_nombre...) mientras que el front usa camelCase en inglés: los mapeos
// viven en los servicios para no tocar componentes.
// ---------------------------------------------------------------------------

export interface ApiUsuario {
  id_usuario: number;
  primer_nombre: string;
  segundo_nombre: string | null;
  primer_apellido: string | null;
  segundo_apellido: string | null;
  tipo_documento_codigo: string | null;
  numero_documento: string | null;
  rol_codigo: string;
  correo: string;
  celular: string | null;
  fecha_nacimiento: string | null;
  estado_codigo: string;
  fecha_registro: string;
  foto_url?: string | null;
  auth_proveedor?: 'LOCAL' | 'GOOGLE';
  perfil_completo?: boolean;
}

export interface GoogleLoginResult {
  user: User;
  profileIncomplete: boolean;
}

export function mapUsuarioToUser(usuario: ApiUsuario): User {
  const nombres = [usuario.primer_nombre, usuario.segundo_nombre].filter(Boolean).join(' ');
  const apellidos = [usuario.primer_apellido, usuario.segundo_apellido].filter(Boolean).join(' ');

  return {
    id: String(usuario.id_usuario),
    fullName: [nombres, apellidos].filter(Boolean).join(' '),
    firstName: usuario.primer_nombre,
    middleName: usuario.segundo_nombre ?? undefined,
    lastName: usuario.primer_apellido ?? '',
    secondLastName: usuario.segundo_apellido ?? undefined,
    email: usuario.correo,
    documentId: usuario.numero_documento ?? '',
    birthDate: (usuario.fecha_nacimiento ?? '').slice(0, 10),
    createdAt: usuario.fecha_registro,
    role: usuario.rol_codigo === 'ADMIN' ? 'admin' : 'user',
    phone: usuario.celular ?? undefined,
    profileComplete: usuario.perfil_completo ?? true,
    authProvider: usuario.auth_proveedor === 'GOOGLE' ? 'google' : 'local',
    photoUrl: usuario.foto_url ?? undefined,
    documentType: usuario.tipo_documento_codigo ?? undefined,
  };
}

/** En mock: entiende la credencial simulada o un id_token real de Google (solo lee el payload, sin verificar). */
function decodeMockGoogle(credential: string): { email: string; firstName: string; lastName: string } {
  if (credential !== MOCK_GOOGLE_CREDENTIAL) {
    try {
      const payload = JSON.parse(atob(credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as {
        email?: string;
        given_name?: string;
        family_name?: string;
        name?: string;
      };
      if (payload.email) {
        return {
          email: payload.email.toLowerCase(),
          firstName: payload.given_name ?? payload.name ?? payload.email.split('@')[0],
          lastName: payload.family_name ?? '',
        };
      }
    } catch {
      /* credencial no decodificable: se usa la simulada */
    }
  }
  return { email: 'google.demo@playboss.co', firstName: 'Google', lastName: 'Demo' };
}

export const authService = {
  login(payload: LoginPayload): Promise<User> {
    return withMock(
      async () => {
        const res = await httpClient.post<ApiEnvelope<{ usuario: ApiUsuario; token: string }>>(
          '/auth/login',
          { correo: payload.email, contrasena: payload.password, recaptcha_token: await getRecaptchaToken('login') },
          { auth: false },
        );
        setAccessToken(res.data.token);
        return mapUsuarioToUser(res.data.usuario);
      },
      () => {
        const rec = findUserByEmail(payload.email);
        if (!rec || rec.password !== payload.password) throw mockError('Correo o contraseña incorrectos.', 401);
        if (rec.status !== 'ACT') throw mockError('Tu cuenta no está activa. Contacta a soporte.', 403);
        setAccessToken(mockToken(rec.user.id));
        return rec.user;
      },
    );
  },

  register(payload: RegisterPayload): Promise<User> {
    return withMock(
      async () => {
        // El API exige multipart/form-data porque `foto` es un archivo obligatorio.
        const form = new FormData();
        const fields: Record<string, string | undefined> = {
          primer_nombre: payload.firstName,
          segundo_nombre: payload.middleName,
          primer_apellido: payload.lastName,
          segundo_apellido: payload.secondLastName,
          tipo_documento_codigo: payload.documentType,
          numero_documento: payload.documentId,
          correo: payload.email,
          celular: payload.phone,
          fecha_nacimiento: payload.birthDate,
          contrasena: payload.password,
          contrasena_confirmation: payload.passwordConfirmation,
          recaptcha_token: await getRecaptchaToken('registro'),
        };
        Object.entries(fields).forEach(([k, v]) => {
          if (v) form.append(k, v);
        });
        if (payload.photo) form.append('foto', payload.photo);
        const res = await httpClient.post<ApiEnvelope<{ usuario: ApiUsuario; token: string }>>('/auth/registro', form, {
          auth: false,
        });
        setAccessToken(res.data.token);
        return mapUsuarioToUser(res.data.usuario);
      },
      () => {
        const db = getDb();
        if (findUserByEmail(payload.email)) throw mockError('Ya existe una cuenta con ese correo.');
        if (db.users.some((u) => u.user.documentId === payload.documentId))
          throw mockError('Ya existe una cuenta con ese documento.');
        const id = String(nextId(db));
        const user: User = {
          id,
          firstName: payload.firstName,
          middleName: payload.middleName || undefined,
          lastName: payload.lastName,
          secondLastName: payload.secondLastName || undefined,
          fullName: [payload.firstName, payload.middleName, payload.lastName, payload.secondLastName]
            .filter(Boolean)
            .join(' '),
          email: payload.email.trim().toLowerCase(),
          documentId: payload.documentId,
          documentType: payload.documentType,
          phone: payload.phone || undefined,
          birthDate: payload.birthDate,
          createdAt: new Date().toISOString(),
          role: 'user',
        };
        db.users.push({ user, password: payload.password, status: 'ACT' });
        saveDb();
        setAccessToken(mockToken(id));
        return user;
      },
    );
  },

  /** Inicio de sesión / registro con Google. `credential` es el id_token de Google Identity Services. */
  loginWithGoogle(credential: string): Promise<GoogleLoginResult> {
    return withMock(
      async () => {
        const res = await httpClient.post<
          ApiEnvelope<{ usuario: ApiUsuario; token: string; perfil_incompleto: boolean }>
        >('/auth/google', { credential }, { auth: false });
        setAccessToken(res.data.token);
        return { user: mapUsuarioToUser(res.data.usuario), profileIncomplete: res.data.perfil_incompleto };
      },
      () => {
        const g = decodeMockGoogle(credential);
        const db = getDb();
        let rec = findUserByEmail(g.email);
        if (!rec) {
          const id = String(nextId(db));
          const user: User = {
            id,
            firstName: g.firstName,
            lastName: g.lastName,
            fullName: [g.firstName, g.lastName].filter(Boolean).join(' '),
            email: g.email,
            documentId: '',
            birthDate: '',
            createdAt: new Date().toISOString(),
            role: 'user',
            profileComplete: false,
            authProvider: 'google',
          };
          const created: MockUserRecord = { user, password: '', status: 'ACT' };
          rec = created;
          db.users.push(created);
          saveDb();
        }
        setAccessToken(mockToken(rec.user.id));
        return { user: rec.user, profileIncomplete: rec.user.profileComplete === false };
      },
    );
  },

  /** Completa fecha de nacimiento y documento de un usuario creado con Google. */
  completeGoogleProfile(payload: CompleteProfilePayload): Promise<User> {
    return withMock(
      async () => {
        const res = await httpClient.put<ApiEnvelope<{ usuario: ApiUsuario }>>('/auth/google/completar', {
          primer_apellido: payload.lastName,
          segundo_apellido: payload.secondLastName || null,
          tipo_documento_codigo: payload.documentType,
          numero_documento: payload.documentId,
          fecha_nacimiento: payload.birthDate,
          celular: payload.phone || null,
        });
        return mapUsuarioToUser(res.data.usuario);
      },
      () => {
        const db = getDb();
        const rec = db.users.find((u) => u.user.id === currentMockUserId());
        if (!rec) throw mockError('Tu sesión ha expirado. Inicia sesión nuevamente.', 401);
        if (rec.user.profileComplete !== false) throw mockError('Tu perfil ya está completo.', 409);
        if (db.users.some((u) => u.user.id !== rec.user.id && u.user.documentId === payload.documentId))
          throw mockError('Ya existe una cuenta con ese documento.');
        Object.assign(rec.user, {
          lastName: payload.lastName,
          secondLastName: payload.secondLastName || undefined,
          fullName: [rec.user.firstName, payload.lastName, payload.secondLastName].filter(Boolean).join(' '),
          documentId: payload.documentId,
          birthDate: payload.birthDate,
          phone: payload.phone || undefined,
          profileComplete: true,
        });
        saveDb();
        return rec.user;
      },
    );
  },

  async logout(): Promise<void> {
    if (isMockActive() || isMockToken(getAccessToken())) {
      setAccessToken(null);
      return;
    }
    try {
      await httpClient.post('/auth/logout');
    } catch {
      /* si el token ya no era válido, igual se limpia la sesión local */
    } finally {
      setAccessToken(null);
    }
  },

  async getCurrentUser(): Promise<User | null> {
    // Evita disparar una petición (y el evento de "sesión expirada") cuando
    // el visitante nunca ha iniciado sesión.
    const token = getAccessToken();
    if (!token) return null;

    if (isMockToken(token)) {
      const id = mockUserIdFromToken(token);
      return getDb().users.find((u) => u.user.id === id)?.user ?? null;
    }

    try {
      const res = await httpClient.get<ApiEnvelope<{ usuario: ApiUsuario }>>('/auth/me');
      return mapUsuarioToUser(res.data.usuario);
    } catch {
      return null;
    }
  },

  // ------------------------------------------------------------------------
  // Recuperación de contraseña. La API no expone "verificar código": el código
  // solo se valida al restablecer (POST /auth/restablecer), por eso
  // verifyRecoveryCode valida el formato y deja la verificación real al final.
  // ------------------------------------------------------------------------
  forgotPassword(payload: ForgotPasswordPayload): Promise<{ sent: boolean }> {
    return withMock(
      async () => {
        await httpClient.post('/auth/recuperar', { correo: payload.email, recaptcha_token: await getRecaptchaToken('recuperar') }, { auth: false });
        return { sent: true };
      },
      () => {
        const rec = findUserByEmail(payload.email);
        if (rec) {
          getDb().recovery[rec.user.email] = MOCK_RECOVERY_CODE;
          saveDb();
        }
        return { sent: true };
      },
    );
  },

  async verifyRecoveryCode(payload: VerifyCodePayload): Promise<{ valid: boolean }> {
    if (!/^\d{6}$/.test(payload.code)) throw mockError('El código debe tener 6 dígitos.');
    return { valid: true };
  },

  resendRecoveryCode(email: string): Promise<{ sent: boolean }> {
    return authService.forgotPassword({ email });
  },

  resetPassword(payload: ResetPasswordPayload): Promise<{ success: boolean }> {
    return withMock(
      async () => {
        await httpClient.post(
          '/auth/restablecer',
          {
            correo: payload.email,
            codigo: payload.code,
            contrasena: payload.password,
            contrasena_confirmation: payload.passwordConfirmation,
            recaptcha_token: await getRecaptchaToken('restablecer'),
          },
          { auth: false },
        );
        return { success: true };
      },
      () => {
        const rec = findUserByEmail(payload.email);
        const db = getDb();
        if (!rec || db.recovery[rec.user.email] !== payload.code) throw mockError('Código inválido o vencido.');
        rec.password = payload.password;
        delete db.recovery[rec.user.email];
        saveDb();
        return { success: true };
      },
    );
  },
};
