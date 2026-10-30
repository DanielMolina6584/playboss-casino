# Contratos API usados por el front

Base: `VITE_API_URL` (p. ej. `http://localhost/playboss-casino-api/public/api`). Auth: `Authorization: Bearer <token Sanctum>`.
Sobre de respuesta: `{ "error": 0|1, "mensaje": string[], "data": ... }`. Listados paginados: `data = { items: [], meta: { page, per_page, total, last_page } }`.
Los contratos de abajo **ya existen** en `playboss-casino-api/routes/api.php` salvo los marcados como **PENDIENTE**.

Modo de datos (`VITE_DATA_MODE`): `auto` (API, y si no responde -> mock), `api`, `mock`. Todo el acceso pasa por `src/services/*` + `src/utils/httpClient.ts`; el mock vive en `src/mocks/*`.
Demo mock: `demo@playboss.co / Demo1234!` (usuario), `admin@playboss.co / Admin1234!` (admin), código de recuperación `123456`.

## Auth
| Endpoint | Request | Response data |
|---|---|---|
| `POST /auth/registro` | `primer_nombre, segundo_nombre?, primer_apellido, segundo_apellido?, tipo_documento_codigo, numero_documento, correo, fecha_nacimiento, contrasena, contrasena_confirmation` | `{ usuario, token }` |
| `POST /auth/login` | `{ correo, contrasena }` | `{ usuario, token }` |
| `POST /auth/logout`, `GET /auth/me` | - | `{ usuario }` |
| `POST /auth/recuperar` | `{ correo }` | mensaje genérico |
| `POST /auth/restablecer` | `{ correo, codigo (6 dígitos), contrasena, contrasena_confirmation }` | mensaje |

Nota: no hay endpoint de "verificar código"; el front valida formato y la verificación real ocurre en `/auth/restablecer`.

## Perfil
- `PUT /perfil` `{ primer_nombre, segundo_nombre?, primer_apellido, segundo_apellido?, celular? }` -> `{ usuario }`
- `PUT /perfil/contrasena` `{ contrasena_actual, contrasena, contrasena_confirmation }`

## Catálogo (público)
- `GET /ligas?servicio_codigo=FUTBOL&per_page=100` -> `items[{ id_liga, nombre, pais{...}, logo_drive_id, activa }]`
- `GET /partidos?estado=PROG&liga_id=&desde=&hasta=&per_page=100` -> `items[{ id_partido, fecha_hora, estado_codigo (PROG|ENJ|FIN|SUSP), local{id_equipo,nombre,escudo_drive_id}, visitante{...}, jornada.temporada.liga{...} }]`
- `GET /partidos/{id}/mercados` -> `[{ id, code, name, selections:[{ code, label, odd }] }]`
- **Por reconciliar:** el front busca por texto (`q`) en cliente porque `/partidos` no filtra por equipo/liga por nombre; el N+1 de mercados (1 llamada por partido) convendría reemplazarlo por `GET /partidos?incluir=mercados`. Los logos llegan como `*_drive_id`: falta una URL pública para mostrarlos (hoy se usan iniciales).

## Cuenta
- `GET /cuenta` -> `{ saldo_disponible, saldo_retenido, moneda }`
- `GET /cuenta/movimientos?tipo=&desde=&hasta=&page=&per_page=` -> `items[{ id, tipo, monto, saldo_disponible, saldo_retenido, apuesta_id, descripcion, fecha }]`
  `tipo`: `DEPOSITO | RETIRO | APUESTA_RESERVADA | APUESTA_ANULADA | APUESTA_PERDIDA | APUESTA_GANADA` (confirmar lista completa).

## Apuestas
- `POST /apuestas` `{ monto: "10000", tipo: SIMPLE|COMBINADA, idempotency_key, selecciones:[{ match_id, market_id, selection_code, odd }] }` -> apuesta.
  El front, en modo "simples" con N selecciones, hace N POST (clave `<key>-<i>`).
- `GET /apuestas?estado=PEND|GAN|PER|ANU&page=&per_page=`, `GET /apuestas/{id}`, `POST /apuestas/{id}/cancelar`
- Apuesta: `{ id, tipo, estado, monto, cuota_total, pago_potencial, creada_en, liquidada_en, selecciones:[{ partido_id, market_id, selection_code, etiqueta, cuota, resultado }] }`
- **Por reconciliar:** las selecciones no traen nombre de partido ni de mercado ni fecha de partido. El front recuerda "Local vs Visitante" en localStorage (`utils/matchLabels.ts`) y muestra `Partido #id` si no lo conoce. Pedir `partido: { id, local, visitante, fecha_hora }` y `mercado_nombre` en cada selección. `resultado` se interpreta GAN/PER/ANU/otro=pendiente (confirmar valores). `cancellable` se deduce de `estado === PEND` (la API responde 409 si el partido ya inició).
- Límites usados en cliente (`src/config/limits.ts`): monto 1.000–2.000.000, máx. 10 selecciones, recarga 10.000–5.000.000. Idealmente la API los expondría (`GET /configuracion`).

## Pagos (Wompi sandbox)
- `POST /pagos/depositos` `{ monto: "50000", idempotency_key, metodo? }` (`metodo` es informativo: `WOMPI_CARD|NEQUI|PSE`; la API actual lo ignora) ->
  `{ referencia, estado, monto, moneda, tipo, creada_en, confirmada_en, checkout:{ provider, public_key, reference, amount_in_cents, currency, signature_integrity, redirect_url, checkout_url }, checkout_url }`
- El front arma `https://checkout.wompi.co/p/?public-key&currency&amount-in-cents&reference&signature:integrity&redirect-url` con esos datos y redirige (`services/paymentsService.buildWompiUrl`). `redirect-url` por defecto = `<origen>/billetera/recarga/resultado` (**configurar `services.wompi.redirect_url` en el back con esa ruta**). Wompi agrega `?id=<id transacción>`; el front identifica la transacción por la referencia guardada en `sessionStorage` (o `?referencia=` si el back la incluye en la URL).
- `GET /pagos/{referencia}` -> `{ referencia, estado, monto, moneda, tipo, creada_en, confirmada_en }`. Estados mapeados: `PENDIENTE->pending`, `APROBADA->approved`, `DECLINED->declined`, `FAILED|CANCELLED|otro->error`. La pantalla de resultado hace polling cada 3 s (máx. ~30 s) y luego ofrece "Consultar de nuevo".
- **Por reconciliar:** el método de pago (tarjeta/Nequi/PSE) no se puede preseleccionar en el Web Checkout; el usuario lo elige en Wompi.
- **PENDIENTE — Retiros:** no hay endpoint. `POST /pagos/retiros` `{ monto, cuenta_destino, idempotency_key }` -> transacción tipo `RETIRO`. Hoy `/billetera/retiro` registra una solicitud simulada (local, no mueve dinero, claramente marcada en la UI).

## Otros PENDIENTES (hoy simulados en el front)
- `GET /admin/usuarios` (listado para el panel admin; hoy solo mock). Los demás `/admin/*` existen pero el front aún no los consume (panel de solo lectura sobre `/partidos`).
- Límites de juego responsable (`GET/PUT /perfil/limites`: depósito diario/semanal, apuesta diaria): hoy se guardan en localStorage.
- `POST /contacto` `{ nombre, correo, mensaje }`: el formulario de contacto es simulado.
- `Retry-After`/mensajes del throttle (login, apuestas, pagos) se muestran tal cual llegan en `mensaje[]`.
