# PlayBoss — Plataforma de apuestas deportivas

Frontend en **React + TypeScript + Vite + Tailwind CSS**, construido a partir del diseño de
referencia (paleta negro/blanco/dorado, estilo premium) y del brief funcional proporcionado.

## 1. Instalación

Requisitos: **Node.js 18+** y npm.

```bash
cd playboss
npm install
```

## 2. Variables de entorno

Copia `.env.example` a `.env` y define la URL de tu API cuando el backend esté listo:

```bash
cp .env.example .env
```

```
VITE_API_URL=https://api.playboss.com
```

Mientras no exista backend, todos los `services/` funcionan con datos simulados
(`mocks/data.ts` + respuestas mock con latencia artificial), así que la app es
100% funcional sin API desde el primer `npm run dev`.

## 3. Comandos

```bash
npm run dev        # servidor de desarrollo (http://localhost:5173)
npm run build       # build de producción (type-check + bundle en /dist)
npm run preview     # sirve el build de producción localmente
npm run lint         # linting con ESLint
```

## 4. Credenciales de prueba (mientras no hay backend)

- Cualquier correo válido.
- Contraseña: `playboss123`

El código de recuperación de contraseña (mock) es siempre `123456` y se
imprime también en la consola del navegador para pruebas.

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

## 7. Conectar con tu API real

Todos los `services/*.ts` están aislados de los componentes. Para conectar el backend:

1. Define `VITE_API_URL` en `.env`.
2. Reemplaza el cuerpo de cada función en `authService`, `matchesService`, `betsService` y
   `userService` por llamadas a `httpClient` (ya incluido en `utils/httpClient.ts`, con manejo
   centralizado de 401/403/500 y token de acceso).
3. No hay que tocar componentes ni páginas: consumen los servicios por su interfaz pública.

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
