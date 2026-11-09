import type { ChangePasswordPayload, ResponsibleLimits, User } from '@/types';
import { httpClient, type ApiEnvelope } from '@/utils/httpClient';
import { currentMockUserId, isMockActive, mockError, withMock } from '@/services/dataSource';
import { getDb, saveDb } from '@/mocks/store';
import { mapUsuarioToUser, type ApiUsuario } from '@/services/authService';

// Contrato: PUT /perfil, PUT /perfil/contrasena, GET|POST /perfil/foto (docs/CONTRATOS-API.md)

export interface ProfileChanges {
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  phone?: string;
}

const LIMITS_KEY = 'playboss_responsible_limits';
const EMPTY_LIMITS: ResponsibleLimits = { dailyDeposit: null, weeklyDeposit: null, dailyStake: null };

export const userService = {
  updateProfile(changes: ProfileChanges): Promise<User> {
    return withMock(
      async () => {
        const res = await httpClient.put<ApiEnvelope<{ usuario: ApiUsuario }>>('/perfil', {
          primer_nombre: changes.firstName,
          segundo_nombre: changes.middleName || null,
          primer_apellido: changes.lastName,
          segundo_apellido: changes.secondLastName || null,
          celular: changes.phone || null,
        });
        return mapUsuarioToUser(res.data.usuario);
      },
      () => {
        const rec = getDb().users.find((u) => u.user.id === currentMockUserId());
        if (!rec) throw mockError('Usuario no encontrado.', 404);
        Object.assign(rec.user, {
          ...changes,
          fullName: [changes.firstName, changes.middleName, changes.lastName, changes.secondLastName]
            .filter(Boolean)
            .join(' '),
        });
        saveDb();
        return { ...rec.user };
      },
    );
  },

  changePassword(payload: ChangePasswordPayload): Promise<void> {
    return withMock(
      async () => {
        await httpClient.put('/perfil/contrasena', {
          contrasena_actual: payload.currentPassword,
          contrasena: payload.password,
          contrasena_confirmation: payload.passwordConfirmation,
        });
      },
      () => {
        const rec = getDb().users.find((u) => u.user.id === currentMockUserId());
        if (!rec || rec.password !== payload.currentPassword) throw mockError('La contraseña actual no es correcta.');
        rec.password = payload.password;
        saveDb();
      },
    );
  },

  /** Sube o reemplaza la foto de perfil (la API la guarda en Google Drive). */
  uploadPhoto(photo: File): Promise<User> {
    return withMock(
      async () => {
        const form = new FormData();
        form.append('foto', photo);
        const res = await httpClient.postForm<ApiEnvelope<{ usuario: ApiUsuario }>>('/perfil/foto', form);
        return mapUsuarioToUser(res.data.usuario);
      },
      () => {
        throw mockError('La foto de perfil solo se puede cambiar con la API conectada.');
      },
    );
  },

  /** Descarga la foto de perfil como archivo (la petición lleva el token). */
  getPhoto(): Promise<Blob> {
    return httpClient.getBlob('/perfil/foto');
  },

  /** Límites de juego responsable: aún sin endpoint, se guardan solo en este navegador. */
  getLimits(userId: string): ResponsibleLimits {
    try {
      const all = JSON.parse(localStorage.getItem(LIMITS_KEY) ?? '{}') as Record<string, ResponsibleLimits>;
      return { ...EMPTY_LIMITS, ...all[userId] };
    } catch {
      return { ...EMPTY_LIMITS };
    }
  },

  saveLimits(userId: string, limits: ResponsibleLimits): void {
    try {
      const all = JSON.parse(localStorage.getItem(LIMITS_KEY) ?? '{}') as Record<string, ResponsibleLimits>;
      all[userId] = limits;
      localStorage.setItem(LIMITS_KEY, JSON.stringify(all));
    } catch {
      throw mockError('No fue posible guardar tus límites en este navegador.');
    }
  },
};

/** Listado de usuarios para el panel admin (la API aún no expone /admin/usuarios). */
export async function listUsersForAdmin(): Promise<{ users: User[]; pendingEndpoint: boolean }> {
  if (isMockActive()) return { users: getDb().users.map((u) => u.user), pendingEndpoint: false };
  return { users: [], pendingEndpoint: true };
}
