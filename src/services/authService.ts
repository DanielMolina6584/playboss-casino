import type {
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  User,
  VerifyCodePayload,
} from '@/types';
import { getAccessToken, httpClient, setAccessToken } from '@/utils/httpClient';

// ---------------------------------------------------------------------------
// Conectado a la API real de playboss (Laravel + Sanctum).
// La API trabaja en español (correo, contrasena, primer_nombre...) mientras
// que el front usa camelCase en inglés: los mapeos viven en este archivo
// para no tener que tocar componentes ni el resto de la app.
// ---------------------------------------------------------------------------

interface ApiUsuario {
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

interface ApiEnvelope<T> {
  error: 0 | 1;
  mensaje: string[];
  data: T;
}

function mapUsuarioToUser(usuario: ApiUsuario): User {
  const nombres = [usuario.primer_nombre, usuario.segundo_nombre].filter(Boolean).join(' ');
  const apellidos = [usuario.primer_apellido, usuario.segundo_apellido].filter(Boolean).join(' ');

  return {
    id: String(usuario.id_usuario),
    fullName: [nombres, apellidos].filter(Boolean).join(' '),
    email: usuario.correo,
    documentId: usuario.numero_documento,
    birthDate: usuario.fecha_nacimiento.slice(0, 10),
    createdAt: usuario.fecha_registro,
    role: usuario.rol_codigo === 'ADMIN' ? 'admin' : 'user',
  };
}

export const authService = {
  async login(payload: LoginPayload): Promise<User> {
    const res = await httpClient.post<ApiEnvelope<{ usuario: ApiUsuario; token: string }>>(
      '/auth/login',
      { correo: payload.email, contrasena: payload.password },
      { auth: false }
    );
    setAccessToken(res.data.token);
    return mapUsuarioToUser(res.data.usuario);
  },

  async register(payload: RegisterPayload): Promise<User> {
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
      { auth: false }
    );
    setAccessToken(res.data.token);
    return mapUsuarioToUser(res.data.usuario);
  },

  async logout(): Promise<void> {
    try {
      await httpClient.post('/auth/logout');
    } finally {
      setAccessToken(null);
    }
  },

  async getCurrentUser(): Promise<User | null> {
    // Evita disparar una petición (y el evento de "sesión expirada") cuando
    // el visitante nunca ha iniciado sesión.
    if (!getAccessToken()) return null;

    try {
      const res = await httpClient.get<ApiEnvelope<{ usuario: ApiUsuario }>>('/auth/me');
      return mapUsuarioToUser(res.data.usuario);
    } catch {
      return null;
    }
  },

  // ------------------------------------------------------------------------
  // Recuperación de contraseña: aún no implementada en la API (fuera del
  // alcance de esta entrega). Se deja simulada para no romper esas pantallas.
  // ------------------------------------------------------------------------
  async forgotPassword(payload: ForgotPasswordPayload): Promise<{ sent: boolean }> {
    // eslint-disable-next-line no-console
    console.warn('[playboss] forgotPassword aún no está conectado a la API', payload);
    return { sent: true };
  },

  async verifyRecoveryCode(_payload: VerifyCodePayload): Promise<{ valid: boolean }> {
    return { valid: true };
  },

  async resendRecoveryCode(email: string): Promise<{ sent: boolean }> {
    // eslint-disable-next-line no-console
    console.warn('[playboss] resendRecoveryCode aún no está conectado a la API', email);
    return { sent: true };
  },

  async resetPassword(_payload: ResetPasswordPayload): Promise<{ success: boolean }> {
    return { success: true };
  },
};
