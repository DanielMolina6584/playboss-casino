import type { ContactPayload } from '@/types';
import { httpClient, type ApiEnvelope } from '@/utils/httpClient';
import { withMock } from '@/services/dataSource';

// Contrato: POST /contacto { nombre, correo, asunto, mensaje } -> 201 | 422 | 429 | 503

export const contactService = {
  send(payload: ContactPayload): Promise<void> {
    return withMock(
      async () => {
        await httpClient.post<ApiEnvelope<unknown>>(
          '/contacto',
          { nombre: payload.name, correo: payload.email, asunto: payload.subject, mensaje: payload.message },
          { auth: false },
        );
      },
      () => undefined,
      600,
    );
  },
};
