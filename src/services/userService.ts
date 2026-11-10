import type { ChangePasswordPayload, User } from '@/types';
import { httpClient, type ApiEnvelope } from '@/utils/httpClient';
import { currentMockUserId, mockError, withMock } from '@/services/dataSource';
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
};
