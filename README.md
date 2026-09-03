# PlayBoss — Plataforma de apuestas deportivas

Frontend en **React + TypeScript + Vite + Tailwind CSS**, construido a partir del diseño de
referencia (paleta negro/blanco/dorado, estilo premium) y del brief funcional proporcionado.

## 1. Instalación

Requisitos: **Node.js 18+** y npm, y la API (`playboss-api`) corriendo (ver su propio README).

```bash
npm install
```

## 2. Variables de entorno

Copia `.env.example` a `.env`:

```bash
cp .env.example .env
```

```
VITE_API_URL=http://127.0.0.1:8811/api
VITE_FEATURE_MATCHES=false
```

- `VITE_API_URL`: URL base de la API real.
- `VITE_FEATURE_MATCHES`: muestra u oculta la sección de "Próximos partidos"/cuotas en Home y
  la página Apuestas (ver `src/config/features.ts`). Se deja en `false` mientras esos datos no
  vengan de la API real; cuando existan los endpoints, basta con ponerlo en `true` y reiniciar
  `npm run dev` — no hay que tocar código.

Login y registro ya están conectados a la API real. Partidos/cuotas, apuestas, perfil y
recuperación de contraseña siguen con datos simulados (`mocks/data.ts` + `services/` con
latencia artificial) a la espera de sus endpoints correspondientes.

## 3. Comandos

```bash
npm run dev        # servidor de desarrollo (http://localhost:5173)
npm run build       # build de producción (type-check + bundle en /dist)
npm run preview     # sirve el build de producción localmente
npm run lint         # linting con ESLint
```

## 4. Probar login/registro

Login y registro usan la API real (`playboss-api`). Para probar: registra un usuario nuevo
desde `/registro` (pide nombre(s)/apellido(s), tipo y número de documento, correo, fecha de
nacimiento y contraseña) y luego inicia sesión desde `/login` con esas credenciales.

El código de recuperación de contraseña (`/recuperar/*`) sigue siendo mock — siempre `123456`,
impreso en la consola del navegador — porque la API todavía no tiene ese endpoint.

## 5. Arquitectura de carpetas

```
src/
├── components/
│   ├── common/      Button, Input, PasswordInput, CodeInput, Modal, Toast,
│   │                 Loading, EmptyState, ErrorMessage, FormField
│   ├── layout/       Navbar, Footer, AppLayout
│   ├── match/        MatchCard, LeagueTabs, OddsButton
│   └── betslip/       BetSlip, BetSlipItem, BetSlipDrawer (desktop panel + mobile bottom sheet)
├── pages/
│   ├── auth/         Login, Registro, Recuperar, RecuperarCodigo, RecuperarNuevaContrasena
│   ├── Home.tsx
│   ├── Apuestas.tsx
│   ├── MisApuestas.tsx
│   ├── Perfil.tsx
│   ├── Admin.tsx      (protegido por rol admin)
│   └── NotFound.tsx
├── services/          authService, matchesService, betsService, userService
├── context/            AuthContext, BetSlipContext, ToastContext
├── hooks/               useAuth, useBetSlip, useToast
├── router/              ProtectedRoute, PublicOnlyRoute, AdminRoute
├── types/                Modelos/interfaces de dominio
├── utils/                httpClient, validators, formatters
└── mocks/                Datos de partidos/equipos/ligas de ejemplo
```

## 6. Rutas

| Ruta                              | Acceso              | Descripción                          |
|------------------------------------|----------------------|----------------------------------------|
| `/`                                 | Pública              | Home                                     |
| `/apuestas`                        | Pública              | Listado de partidos y mercados          |
| `/login`                            | Solo invitados       | Inicio de sesión                        |
| `/registro`                        | Solo invitados       | Registro de usuario                     |
| `/recuperar`                        | Solo invitados       | Paso 1: solicitar código                |
| `/recuperar/codigo`                 | Solo invitados       | Paso 2: verificar código (6 dígitos)    |
| `/recuperar/nueva-contrasena`      | Solo invitados       | Paso 3: nueva contraseña                |
| `/mis-apuestas`                    | **Privada**           | Historial de apuestas del usuario       |
| `/perfil`                          | **Privada**           | Perfil del usuario                      |
| `/admin`                            | **Privada + rol admin** | Panel administrativo (base, listo para ampliar) |

- **PublicOnlyRoute**: si ya hay sesión activa, redirige fuera de login/registro/recuperación.
- **ProtectedRoute**: si no hay sesión, redirige a `/login` conservando la ruta de origen.
- **AdminRoute**: exige sesión + `user.role === 'admin'`.

## 7. Conectar el resto de la API

Todos los `services/*.ts` están aislados de los componentes — ningún componente llama `fetch`
directamente. `authService` ya llama a la API real (`httpClient.post/get`, ver
`utils/httpClient.ts` para el manejo centralizado de 401/403/500 y token de acceso). Para
conectar `matchesService`, `betsService` y `userService` cuando existan sus endpoints:

1. Reemplaza el cuerpo de cada función por llamadas a `httpClient`, igual que en `authService`.
2. No hay que tocar componentes ni páginas: consumen los servicios por su interfaz pública.
3. Si el endpoint conecta partidos/cuotas, activa `VITE_FEATURE_MATCHES=true` en `.env`.

## 8. Assets incluidos

En `public/assets/` encontrarás los recursos recortados de tu imagen de referencia:

- `logos/laliga/` y `logos/epl/` — escudos de los 5 equipos de cada liga
- `backgrounds/` — fondos de página (estadio, abstracto, textura)
- `form-backgrounds/` — fondos para pantallas de login/registro/recuperación
- `icons/` — íconos dorados (balón, trofeo, corona, escudo, monedas, regalo, reloj, candado)
- `hero/` — banners promocionales
- `extras/` — elementos decorativos sueltos (balones, arco, destellos, cancha)
- `logo.png` — logo oficial PlayBoss

## 9. Próximos pasos sugeridos (no implementados a propósito)

- Apuestas en vivo, más deportes/ligas/mercados, estadísticas, más métodos de pago.
- CRUD real del panel `/admin` (ligas, equipos, partidos, cuotas, usuarios).
- Internacionalización de requisitos legales por jurisdicción (los textos legales están
  como placeholders configurables, según lo solicitado).
