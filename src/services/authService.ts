import type {
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  User,
  VerifyCodePayload,
} from '@/types';
import { getAccessToken, httpClient, setAccessToken, type ApiEnvelope } from '@/utils/httpClient';
import { isMockActive, isMockToken, mockError, mockToken, mockUserIdFromToken, withMock } from '@/services/dataSource';
import { findUserByEmail, getDb, MOCK_RECOVERY_CODE, nextId, saveDb } from '@/mocks/store';

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
  primer_apellido: string;
  segundo_apellido: string | null;
  tipo_documento_codigo: string;
  numero_documento: string;
  rol_codigo: string;
  correo: string;
  celular: string | null;
  fecha_nacimiento: string;
  estado_codigo: string;
  fecha_registro: string;
}

export function mapUsuarioToUser(usuario: ApiUsuario): User {
  const nombres = [usuario.primer_nombre, usuario.segundo_nombre].filter(Boolean).join(' ');
  const apellidos = [usuario.primer_apellido, usuario.segundo_apellido].filter(Boolean).join(' ');

  return {
    id: String(usuario.id_usuario),
    fullName: [nombres, apellidos].filter(Boolean).join(' '),
    firstName: usuario.primer_nombre,
    middleName: usuario.segundo_nombre ?? undefined,
    lastName: usuario.primer_apellido,
    secondLastName: usuario.segundo_apellido ?? undefined,
    email: usuario.correo,
    documentId: usuario.numero_documento,
    birthDate: (usuario.fecha_nacimiento ?? '').slice(0, 10),
    createdAt: usuario.fecha_registro,
    role: usuario.rol_codigo === 'ADMIN' ? 'admin' : 'user',
    phone: usuario.celular ?? undefined,
  };
}

export const authService = {
  login(payload: LoginPayload): Promise<User> {
    return withMock(
      async () => {
        const res = await httpClient.post<ApiEnvelope<{ usuario: ApiUsuario; token: string }>>(
          '/auth/login',
          { correo: payload.email, contrasena: payload.password },
          { auth: false },
        );
        setAccessToken(res.data.token);
        return mapUsuarioToUser(res.data.usuario);
      },
      () => {
        const rec = findUserByEmail(payload.email);
        if (!rec || rec.password !== payload.password) throw mockError('Correo o contraseña incorrectos.', 401);
        setAccessToken(mockToken(rec.user.id));
        return rec.user;
      },
    );
  },

  register(payload: RegisterPayload): Promise<User> {
    return withMock(
      async () => {
        const res = await httpClient.post<ApiEnvelope<{ usuario: ApiUsuario; token: string }>>(
          '/auth/registro',
          {
            primer_nombre: payload.firstName,
            segundo_nombre: payload.middleName || null,
            primer_apellido: payload.lastName,
            segundo_apellido: payload.secondLastName || null,
            tipo_documento_codigo: payload.documentType,
            numero_documento: payload.documentId,
            correo: payload.email,
            fecha_nacimiento: payload.birthDate,
            contrasena: payload.password,
            contrasena_confirmation: payload.passwordConfirmation,
          },
          { auth: false },
        );
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
          birthDate: payload.birthDate,
          createdAt: new Date().toISOString(),
          role: 'user',
        };
        db.users.push({ user, password: payload.password });
        saveDb();
        setAccessToken(mockToken(id));
        return user;
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
        await httpClient.post('/auth/recuperar', { correo: payload.email }, { auth: false });
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
