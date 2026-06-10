# FitFront

Frontend de una app de fitness personal que consume una API REST de NestJS.
Permite gestionar rutinas anidadas (Split → Microciclos → Días → Ejercicios) y
registrar entrenamientos serie por serie desde el celular.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** + **shadcn/ui**
- **TanStack Query** (estado del servidor)
- **react-hook-form** + **zod** (formularios y validación)
- **axios** con interceptor de JWT y manejo de 401

> ⚠️ Next.js 16: `params`/`searchParams` son `Promise` (se hace `await`), y el
> antiguo `middleware` ahora es **`proxy.ts`** en la raíz.

## Requisitos

- Node.js >= 20.9
- La API de NestJS corriendo y accesible.

## Cómo arrancar en dev

```bash
npm install
cp .env.example .env.local   # y editá la URL de la API
npm run dev                  # http://localhost:3001
```

## Variables de entorno

| Variable              | Descripción                                  | Ejemplo                 |
| --------------------- | -------------------------------------------- | ----------------------- |
| `NEXT_PUBLIC_API_URL` | URL base de la API REST (sin slash final)    | `http://localhost:3000` |

## Scripts

- `npm run dev` — servidor de desarrollo (puerto 3001)
- `npm run build` — build de producción
- `npm run start` — sirve el build (puerto 3001)
- `npm run lint` — ESLint

## Estructura

```
app/                 rutas (App Router)
  login/             /login
  splits/[id]/       editor de rutina
    days/[dayId]/workout/   modo entrenamiento
  providers.tsx      QueryClientProvider + Toaster
components/
  ui/                componentes de shadcn/ui
  auth/ layout/ splits/ editor/ workout/
hooks/               hooks de React Query por recurso
lib/                 api (axios), auth (cookie), query-keys, schemas (zod)
types/               tipos de la API
proxy.ts             protección de rutas (ex-middleware)
```

## Autenticación

El JWT se guarda en una **cookie no httpOnly** (`fitfront_token`):

- El interceptor de axios la lee y la adjunta como `Authorization: Bearer …` a la
  API externa (la cookie no viaja sola al ser otro origen).
- `proxy.ts` chequea su presencia para redirigir a `/login` las rutas privadas.
- Ante un `401`, el interceptor limpia la cookie y redirige a `/login`.

> Nota de seguridad: al ser legible por JS, la cookie es vulnerable a XSS. Es un
> trade-off aceptable para una app personal de pocos usuarios. En producción se
> sirve con `Secure` + `SameSite=Lax`.

## Pantallas

1. **/login** — email + contraseña.
2. **/** — dashboard con las rutinas (crear / editar / borrar).
3. **/splits/[id]** — editor anidado con CRUD en cada nivel (dialogs).
4. **/splits/[id]/days/[dayId]/workout** — modo entrenamiento: una fila por serie,
   guardado en lote (`PUT /sessions/:id/set-logs`) con update optimista e indicador
   de guardado, más acceso al historial del día.

   Al entrar, **reanuda la sesión de hoy** si existe; si no, crea una nueva.

## Notas para la API

La API debe permitir CORS desde el origen del front (`http://localhost:3001` en dev)
e incluir el header `Authorization`.
