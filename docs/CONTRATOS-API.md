# Contratos API usados por el front

Fuente de verdad: `playboss-casino-api/resources/openapi/openapi.php` (Swagger en `/api/documentation`). Base: `VITE_API_URL`. Auth: `Authorization: Bearer <token Sanctum>`.
Sobre de respuesta: `{ "error": 0|1, "mensaje": string[], "data": ... }`. Listados: `data = { items: [], meta: { page, per_page, total, last_page } }`. Errores 422: `mensaje[]` + `data.errores` por campo (el cliente HTTP une `mensaje` en un texto). Los montos viajan como string decimal.

Modo de datos (`VITE_DATA_MODE`): `auto` (API; si no responde -> mock), `api`, `mock`. Todo pasa por `src/services/*` + `src/utils/httpClient.ts`; el mock vive en `src/mocks/*` (`store.ts`, `limits.ts`) y replica las reglas del back (límites, retiros, estados de usuario).
Demo mock: `demo@playboss.co / Demo1234!` (usuario), `admin@playboss.co / Admin1234!` (admin), código de recuperación `123456`.
Respuestas 5xx con sobre `{error:1,mensaje}` (p. ej. 503 de `/contacto`, 502 de Wompi/Drive) se muestran tal cual y NO activan el fallback a mock.

## Configuración
- `GET /configuracion/limites` (público) -> `{ moneda, apuestas{monto_minimo, monto_maximo, max_selecciones, edad_minima, limite_diario, max_apuestas_dia}, recarga{monto_minimo, monto_maximo}, retiro{monto_minimo, monto_maximo, max_pendientes} }`.
  `src/main.tsx` lo carga antes del primer render (máx. 2 s) y lo vuelca en `LIMITS` (`src/config/limits.ts`, con los valores anteriores como respaldo). No se consulta en modo mock.

## Auth
| Endpoint | Request | Response data |
|---|---|---|
| `POST /auth/registro` | **multipart/form-data**: `primer_nombre, segundo_nombre?, primer_apellido, segundo_apellido?, tipo_documento_codigo, numero_documento, correo, celular?, fecha_nacimiento, contrasena, contrasena_confirmation, foto (obligatoria), recaptcha_token?` | `{ usuario, token }` |
| `POST /auth/login` | `{ correo, contrasena }` | `{ usuario, token }` |
| `POST /auth/logout`, `GET /auth/me` | - | `{ usuario }` |
| `POST /auth/recuperar`, `POST /auth/restablecer` | ver pantallas de recuperación | mensaje |

`foto`: imagen jpg/jpeg/png/webp, máx. 3 MB (`SvcFotoPerfil::REGLAS`). El front valida tipo y tamaño y muestra vista previa. Un 502 significa que Drive falló y el usuario no se creó.
No hay endpoint de "verificar código"; la verificación real ocurre en `/auth/restablecer`.

## Perfil y límites de juego responsable
- `PUT /perfil`, `PUT /perfil/contrasena` (sin cambios).
- `GET /perfil/limites` -> `{ limites{deposito_|apuesta_ + diario|semanal|mensual: string|null}, consumo{<clave>:{limite, usado, disponible}}, autoexclusion{activa, hasta} }`.
- `PUT /perfil/limites` parcial: solo las claves enviadas cambian; `null` quita el límite; `autoexclusion_dias ∈ {1,7,30,90,180,365}` (solo se puede ampliar). UI en Perfil (consumo/disponible por periodo + autoexclusión con confirmación).
- 422 de **límite superado / autoexcluido** en `POST /apuestas` y `POST /pagos/depositos` (`Superas tu límite diario de apuestas (...)`, `Estás autoexcluido hasta AAAA-MM-DD...`): se muestra el mensaje del back con enlace a `/perfil#limites`.

## Catálogo (público)
- `GET /ligas?servicio_codigo=FUTBOL&per_page=100` -> `items[{ id_liga, nombre, logo_url, pais{...}, activa }]`.
- `GET /partidos?estado=PROG&liga_id=&desde=&hasta=&q=&per_page=100` -> `items[{ id_partido, fecha_hora, estado_codigo, local{id_equipo,nombre,escudo_url}, visitante{...}, jornada.temporada.liga }]`. La búsqueda `q` (equipo/liga) la resuelve el servidor.
- `GET /partidos/{id}/mercados` -> `[{ id, code, name, selections:[{ code, label, odd }] }]`.
- Escudos/logos: `escudo_url` / `logo_url` se pintan con `<img>` y, si faltan o fallan, iniciales (`TeamBadge`).
- **Por reconciliar:** N+1 de mercados (1 llamada por partido); convendría `GET /partidos?incluir=mercados`.

## Cuenta
- `GET /cuenta` -> `{ saldo_disponible, saldo_retenido, moneda }`.
- `GET /cuenta/movimientos` -> `items[{ id, tipo, monto, saldo_disponible, saldo_retenido, apuesta_id, descripcion, fecha }]`. `tipo`: `DEPOSITO, RETIRO, APUESTA_RESERVADA, APUESTA_ANULADA, APUESTA_PERDIDA, APUESTA_GANADA, RETIRO_RESERVADO, RETIRO_PAGADO, RETIRO_LIBERADO`.

## Apuestas
- `POST /apuestas` `{ monto, tipo, idempotency_key, selecciones:[{ match_id, market_id, selection_code, odd }] }`. En modo "simples" con N selecciones el front hace N POST (clave `<key>-<i>`).
- `GET /apuestas`, `GET /apuestas/{id}`, `POST /apuestas/{id}/cancelar`. Estados `PEND|GAN|PER|ANU|CASH` (`CASH` se muestra como anulada: no hay pantalla de cash-out).
- Selección: `{ partido_id, partido, local, visitante, local_escudo_url, visitante_escudo_url, liga, fecha_partido, estado_partido, opcion, mercado, market_id, selection_code, etiqueta, cuota, resultado }`. El front ya no guarda nombres en localStorage.

## Pagos (Mercado Pago; Wompi sigue soportado)

- `PAYMENT_GATEWAY_DRIVER=mercadopago`: `POST /pagos/depositos` devuelve `data.checkout_url` (Checkout Pro) y el front redirige a esa URL. Retorno a `/billetera/recarga/resultado` con `external_reference` (la referencia propia) y `payment_id`. Webhook: `POST /pagos/mercadopago/webhook`.
- `GET /partidos?con_mercados=1` añade `mercado_principal` y `mercados_total` a cada partido (una consulta en vez de `/partidos/{id}/mercados` por partido).

### Wompi
- `POST /pagos/depositos` `{ monto, idempotency_key }` -> `{ referencia, estado, ..., checkout:{ public_key, reference, amount_in_cents, currency, signature_integrity, expiration_time?, redirect_url, checkout_url } }`.
- El front arma `https://checkout.wompi.co/p/?public-key&currency&amount-in-cents&reference&signature:integrity&redirect-url[&expiration-time]` desde `data.checkout`.
- Retorno: `/billetera/recarga/resultado` (alias `/pagos/resultado`). Wompi agrega `?id=<id de transacción Wompi>`; **`GET /pagos/{referencia}` busca por la referencia propia (`referencia_externa`), no por ese id**, así que el front usa la referencia guardada en sessionStorage (o `?referencia=`). Configurar `WOMPI_REDIRECT_URL` en el back a `<front>/billetera/recarga/resultado` (el `.env.example` del back apunta a `/pagos/resultado`).
- Estados: `PENDIENTE->pending`, `APROBADA|APPROVED->approved`, `DECLINED->declined`, otro->error. Polling cada 3 s (~30 s).

## Retiros
- `POST /pagos/retiros` `{ monto, banco, tipo_cuenta: AHORROS|CORRIENTE|NEQUI|DAVIPLATA, numero_cuenta (6-20 dígitos), titular (3-120), documento_titular (5-15 dígitos, = documento del usuario), idempotency_key }` -> 201 (200 si reintento) `{ id, estado: PENDIENTE|PAGADO|RECHAZADO, monto, destino{...numero_cuenta enmascarado}, motivo_rechazo, solicitado_en, resuelto_en }`. 409 clave de otro retiro; 422 reglas de negocio.
- `GET /pagos/retiros?page&per_page`. Pantalla `/billetera/retiro`: formulario validado + lista con estado y motivo de rechazo. Reservar/pagar/liberar generan movimientos `RETIRO_*`.

## Contacto
- `POST /contacto` `{ nombre (2-100), correo, asunto (3-150), mensaje (10-2000) }` -> 201 | 422 | 429 | 503 (el mensaje del back se muestra al usuario).

## Admin (rol ADMIN)
- `GET /admin/usuarios?q&estado&rol&page` (documento enmascarado), `PUT /admin/usuarios/{id}/estado` `{ estado: ACT|BLQ|SUS, motivo? }`.
- `GET /admin/retiros?estado&page`, `POST /admin/retiros/{id}/aprobar`, `POST /admin/retiros/{id}/rechazar` `{ motivo (3-200) }` (409 si ya está en el estado contrario).
- Panel `/admin`: pestañas Retiros, Usuarios y Partidos (solo lectura). El CRUD de `/admin/equipos|ligas|partidos|mercados|reglas`, liquidar y anular apuesta no tienen interfaz todavía.
- `Retry-After`/mensajes del throttle se muestran tal cual llegan en `mensaje[]`.
