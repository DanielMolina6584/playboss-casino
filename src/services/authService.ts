import type {
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  User,
  VerifyCodePayload,
} from '@/types';
import { setAccessToken } from '@/utils/httpClient';

// ---------------------------------------------------------------------------
// NOTA: Este servicio está preparado para consumir la API REST real.
// Mientras el backend no está disponible, simula las respuestas con
// latencia artificial para poder construir y probar todo el flujo de UI.
// Sustituir el cuerpo de cada función por llamadas a `httpClient` cuando
// el backend esté listo, sin tener que tocar los componentes.
// ---------------------------------------------------------------------------

const MOCK_DELAY = 700;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const MOCK_USER: User = {
  id: 'usr_1',
  fullName: 'Daniel Restrepo',
  email: 'demo@playboss.com',
  documentId: '1234567890',
  birthDate: '1995-05-20',
  createdAt: new Date().toISOString(),
  role: 'user',
};

let mockRecoveryCode = '';

export const authService = {
  async login(payload: LoginPayload): Promise<User> {
    await wait(MOCK_DELAY);
    if (payload.email.toLowerCase() !== MOCK_USER.email && payload.password !== 'playboss123') {
      // Para demo: cualquier correo con contraseña "playboss123" funciona
      if (payload.password !== 'playboss123') {
        throw { status: 401, message: 'Correo o contraseña incorrectos.' };
      }
    }
    setAccessToken('mock_access_token');
    return { ...MOCK_USER, email: payload.email };
  },

  async register(payload: RegisterPayload): Promise<User> {
    await wait(MOCK_DELAY);
    setAccessToken('mock_access_token');
    return {
      id: 'usr_new',
      fullName: payload.fullName,
      email: payload.email,
      documentId: payload.documentId,
      birthDate: payload.birthDate,
      createdAt: new Date().toISOString(),
      role: 'user',
    };
  },

  async logout(): Promise<void> {
    await wait(200);
    setAccessToken(null);
  },

  async getCurrentUser(): Promise<User | null> {
    const hasSession = localStorage.getItem('playboss_access_token');
    if (!hasSession) return null;
    await wait(300);
    return MOCK_USER;
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<{ sent: boolean }> {
    await wait(MOCK_DELAY);
    mockRecoveryCode = '123456';
    // eslint-disable-next-line no-console
    console.info(`[DEV] Código de recuperación para ${payload.email}: ${mockRecoveryCode}`);
    return { sent: true };
  },

  async verifyRecoveryCode(payload: VerifyCodePayload): Promise<{ valid: boolean }> {
    await wait(MOCK_DELAY);
    if (payload.code !== mockRecoveryCode) {
      throw { status: 400, message: 'El código ingresado no es válido.' };
    }
    return { valid: true };
  },

  async resendRecoveryCode(email: string): Promise<{ sent: boolean }> {
    await wait(MOCK_DELAY);
    mockRecoveryCode = '123456';
    // eslint-disable-next-line no-console
    console.info(`[DEV] Nuevo código de recuperación para ${email}: ${mockRecoveryCode}`);
    return { sent: true };
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<{ success: boolean }> {
    await wait(MOCK_DELAY);
    if (payload.code !== mockRecoveryCode) {
      throw { status: 400, message: 'El código de verificación ya expiró.' };
    }
    return { success: true };
  },
};
