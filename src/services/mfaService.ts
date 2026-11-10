import type { MfaSetup, MfaStatus } from '@/types';
import { httpClient, type ApiEnvelope } from '@/utils/httpClient';
import { currentMockUserId, withMock } from '@/services/dataSource';
import {
  mockAdminResetMfa,
  mockCurrentCode,
  mockMfaActivate,
  mockMfaDisable,
  mockMfaRegenerate,
  mockMfaSetup,
  mockMfaStatus,
} from '@/mocks/mfa';

// Contratos: GET /auth/mfa, POST /auth/mfa/configurar|activar|desactivar|recovery-codes,
// POST /admin/usuarios/{id}/mfa/restablecer (docs de la API: README "Autenticación en dos pasos").

interface ApiMfaEstado {
  habilitado: boolean;
  activo: boolean;
  obligatorio: boolean;
  configuracion_pendiente: boolean;
  recuperacion_restantes: number;
  confirmado_en: string | null;
  emisor: string;
  tiene_contrasena: boolean;
}

interface ApiMfaConfig {
  secreto: string;
  otpauth_uri: string;
  emisor: string;
  cuenta: string;
}

function mapStatus(s: ApiMfaEstado): MfaStatus {
  return {
    enabled: s.habilitado,
    active: s.activo,
    required: s.obligatorio,
    setupPending: s.configuracion_pendiente,
    recoveryRemaining: s.recuperacion_restantes,
    confirmedAt: s.confirmado_en,
    issuer: s.emisor,
    hasPassword: s.tiene_contrasena,
  };
}

/** Un solo campo de código: 6 dígitos = TOTP; otro formato = código de recuperación. */
export function codeFields(raw: string): { codigo?: string; codigo_recuperacion?: string } {
  const v = raw.trim();
  return /^\d{6}$/.test(v.replace(/\s/g, '')) ? { codigo: v.replace(/\s/g, '') } : { codigo_recuperacion: v };
}

export const mfaService = {
  getStatus(): Promise<MfaStatus> {
    return withMock(
      async () => mapStatus((await httpClient.get<ApiEnvelope<ApiMfaEstado>>('/auth/mfa')).data),
      () => mockMfaStatus(currentMockUserId()),
      150,
    );
  },

  /** Genera el secreto pendiente (aún no activo): clave manual + URI otpauth:// para el QR. */
  setup(): Promise<MfaSetup> {
    return withMock(
      async () => {
        const d = (await httpClient.post<ApiEnvelope<ApiMfaConfig>>('/auth/mfa/configurar')).data;
        return { secret: d.secreto, otpauthUri: d.otpauth_uri, issuer: d.emisor, account: d.cuenta };
      },
      () => mockMfaSetup(currentMockUserId()),
      250,
    );
  },

  /** Confirma con el primer código; devuelve los 10 códigos de recuperación (solo se ven esta vez). */
  activate(code: string): Promise<string[]> {
    return withMock(
      async () => (await httpClient.post<ApiEnvelope<{ recuperacion_codigos: string[] }>>('/auth/mfa/activar', { codigo: code })).data.recuperacion_codigos,
      () => mockMfaActivate(currentMockUserId(), code),
      300,
    );
  },

  /** `password` o `googleCredential` (cuentas sin contraseña) + código (TOTP o de recuperación). */
  disable(input: { password?: string; googleCredential?: string; code: string }): Promise<void> {
    return withMock(
      async () => {
        await httpClient.post('/auth/mfa/desactivar', {
          ...(input.password ? { contrasena: input.password } : {}),
          ...(input.googleCredential ? { credential: input.googleCredential } : {}),
          ...codeFields(input.code),
        });
      },
      async () => {
        const f = codeFields(input.code);
        await mockMfaDisable(currentMockUserId(), { password: input.password ?? input.googleCredential, code: f.codigo, recovery: f.codigo_recuperacion });
      },
      300,
    );
  },

  regenerateRecoveryCodes(code: string): Promise<string[]> {
    return withMock(
      async () => (await httpClient.post<ApiEnvelope<{ recuperacion_codigos: string[] }>>('/auth/mfa/recovery-codes', codeFields(code))).data.recuperacion_codigos,
      async () => {
        const f = codeFields(code);
        return mockMfaRegenerate(currentMockUserId(), f.codigo, f.codigo_recuperacion);
      },
      300,
    );
  },

  /** Admin: quita el 2FA de otro usuario y cierra sus sesiones (queda auditado). */
  adminReset(userId: string, reason: string): Promise<{ hadMfa: boolean }> {
    return withMock(
      async () => {
        const r = await httpClient.post<ApiEnvelope<{ tenia_mfa: boolean }>>(`/admin/usuarios/${encodeURIComponent(userId)}/mfa/restablecer`, { motivo: reason });
        return { hadMfa: r.data.tenia_mfa };
      },
      () => ({ hadMfa: mockAdminResetMfa(currentMockUserId(), userId, reason).tenia }),
      300,
    );
  },

  /** Solo modo mock: código vigente para mostrar como ayuda de demostración. */
  mockCurrentCode,
};
