# CLAUDE.md

Guía para Claude Code (claude.ai/code) al trabajar en este repo.

@AGENTS.md

> ⚠️ **Next.js 16, no el que conocés.** Las APIs y convenciones difieren de los
> datos de entrenamiento. Antes de escribir código de rutas o de framework, leé
> la guía correspondiente en `node_modules/next/dist/docs/`. En particular:
> `proxy.ts` (no `middleware.ts`), y `params`/`searchParams` son `Promise`s que
> hay que `await`ear.

## Comandos

- `npm run dev` — servidor de desarrollo en el **puerto 3002** (`http://localhost:3002`)
- `npm run build` / `npm run start` — build de producción / servirlo (también en 3002)
- `npm run lint` — ESLint (config flat; el comando es `eslint` pelado, no `next lint`)
- `npm test` — Vitest, una corrida (`npm run test:watch` para el modo continuo)

Los tests cubren **solo los módulos puros**: la traducción entre lo que guarda
la API y lo que se lee en la planilla. Eso es lo que se rompe en silencio. La
mayoría vive en `lib/`, pero dos están al lado de los componentes que los usan
(`components/routine/entrenar/slots.ts`, `components/routine/sheet/set-delta.ts`),
así que `vitest.config.mts` recoge `{lib,components}/**/*.test.ts` — por nombre
de archivo, no por carpeta. No hay tests de componentes: renderizar React
implicaría sumar jsdom y una testing library, y ninguno de los bugs que
aparecieron hasta ahora vivía ahí.

## Entorno

- `NEXT_PUBLIC_API_URL` — URL base de la API REST externa (NestJS), sin barra
  final (por ejemplo `http://localhost:3000`).
- `NEXT_PUBLIC_USE_MOCKS` — con `"true"` se intercepta el adapter de axios para
  falsear `/auth/*` y que la app corra sin backend. **Temporal**; ver "Capa de
  mocks" más abajo.

La API tiene que permitir CORS desde el origen del front y aceptar el header
`Authorization`.

## Arquitectura

App de gimnasio pensada primero para el celular (UI en castellano) que consume
una API REST externa de NestJS. El estado de servidor vive en TanStack Query; no
hay store de cliente a nivel app.

### Dos superficies sobre una sola capa de datos

Todas las pantallas leen de la API; no queda ningún módulo de datos mockeados.
Lo que cambia es a quién le hablan:

1. **Editor** (`app/splits/*`, `components/editor`, `components/splits`). ABM
   sobre el modelo anidado: armar una rutina, pautar sus objetivos y asignarla a
   un cliente. Solo para entrenadores (la API responde 403 a un cliente que
   escribe). Se llega desde el link del header, no desde el home. `ExerciseRow`
   muestra los objetivos con `toPlanExercise` *y* numera las filas con
   `toSheetItems`, así que el editor exhibe el texto y el número exactos (`02A`)
   que va a leer quien entrene — que es además lo que delata una superserie
   cuyos miembros quedaron separados.
2. **Flujo de quien entrena** (`app/rutina`, `app/rutina/entrenar`,
   `app/progreso`, `components/routine`, `components/progress`). Lee los mismos
   recursos a través de `hooks/use-plan.ts` y los muestra en el idioma
   "planilla". Es la superficie diseñada; el home apunta acá.
3. **La vista del entrenador sobre un cliente** (`app/clientes/[id]`). Reusa los
   componentes de quien entrena con `usePlan(clientId)` y `readOnly` — las
   mismas pantallas, los datos de otro, sin forma de entrenar desde ahí. Filtrar
   por usuario es trabajo del backend; el frontend solo dice de quién quiere los
   datos.

**Hay una sola pantalla de entrenamiento: `/rutina/entrenar`.** Existió una
segunda abajo del editor (`components/workout`, una grilla con debounce); se
borró porque registraba las series contra el usuario *logueado*, así que un
entrenador que abría el día de un cliente las cargaba a su propio nombre. Lo que
un entrenador necesita ver de un cliente está en `/clientes/[id]`.

### La capa "planilla"

La API guarda números; las pantallas hablan en abreviaturas. Cuatro módulos
puros hacen la traducción y son los dueños del vocabulario del dominio:

- `lib/plan.ts` — `DayExercise` → `PlanExercise`: rangos de reps y RIR,
  `toFailure`, segundos de descanso → `"8-10"`, `"0-F"`, `"2'30''"`, más
  `supersetGroup` → `superset`. También `microcycleForWeek()`, que es cómo "la
  semana en curso" se convierte en un conjunto de días.
- `lib/sheet.ts` — la numeración: un bloque por ejercicio, y las superseries
  comparten número con sufijo A/B.
- `lib/set-logs.ts` — `SetLog` (dos booleanos) → `SetEntry` (un estado: done /
  skipped / pending), y la vuelta.
- `lib/progression.ts` — la matemática del gráfico de `/progreso`: un nodo por
  semana medido en 1RM estimado, el alto de las barras escalado desde una línea
  base a la mitad del máximo, y el chip de ganancia/tendencia. `ProgressionRail`
  solo dibuja.

Nada por encima de estos módulos debería formatear un rango de reps ni leer
`completed`/`skipped` directamente.

### Capa de datos

- `lib/api.ts` — una sola instancia de axios. El interceptor de request agrega
  `Authorization: Bearer <token>`; el de response, ante un `401`, borra el token
  y redirige duro a `/login`. `unwrap<T>()` saca `response.data` con tipos.
- `hooks/use-*.ts` — un módulo de hooks por recurso (`use-splits`,
  `use-microcycles`, `use-days`, `use-exercises`, `use-sessions`, `use-progress`,
  `use-auth`). Todos `"use client"`. Las mutaciones invalidan con la fábrica
  centralizada de claves de `lib/query-keys.ts`. `use-sessions` hace upserts por
  lote **optimistas** (`PUT /sessions/:id/set-logs`) indexados por
  `dayExerciseId:setNumber`; las filas optimistas llevan un id falso
  (`OPTIMISTIC_ID_PREFIX`) que nunca puede llegar a un `DELETE`.
- `hooks/use-plan.ts` — `usePlan(userId?)`, el compuesto que usan las pantallas
  de quien entrena: lista → detalle → progreso, resuelto a los `PlanDay[]` de la
  semana en curso más el historial por nombre de ejercicio. Toma la **primera**
  rutina, y con eso alcanza: un usuario tiene exactamente una asignada (regla
  del producto). La API llama al mismo filtro `clientId` en `/splits` y `userId`
  en el resto; este hook lo esconde.
- `hooks/use-reorder.ts` + `lib/reorder.ts` — la posición es un `order` por
  elemento y la API no tiene endpoint de reordenar, así que mover algo son N
  `PATCH`. `reorder()` renumera desde el **mínimo que ya había** (días y
  ejercicios arrancan en 0, los microciclos en 1 porque el `order` de un
  microciclo *es* su número de semana) y devuelve solo los que cambiaron;
  `applyOrders()` los escribe en el `Split` cacheado para repintar sin esperar.
  No hay campo "Orden" a mano en los diálogos — la posición es trabajo de las
  flechas.
- `hooks/use-active-session.ts` — `useTodaysSession` lee la sesión de hoy;
  `useActiveSession` la crea si no existe. Mirar una rutina no puede abrir una
  sesión, así que `/rutina` usa la de solo lectura y solo `/rutina/entrenar` usa
  la que crea.
- `types/api.ts` — espejo del contrato de la API, mantenido a mano.
  `lib/schemas.ts` — schemas de formulario con zod v4 (se usan con
  react-hook-form vía `@hookform/resolvers`); los strings vacíos se convierten en
  `undefined` para los campos numéricos y de texto opcionales.

### Modelo de dominio (anidado)

`Split → Microcycle → Day → DayExercise`, más `WorkoutSession → SetLog[]` que se
registra por día. Entrar a la pantalla de entrenamiento retoma la sesión de hoy
si existe, y si no la crea. Un Split es un macrociclo y un Microcycle es una
semana — `GET /splits/:id/progress` devuelve cuál es la semana en curso más el
historial por ejercicio, y eso es lo que alimenta tanto la barra de semanas como
el gráfico de progresión.

`/rutina/entrenar` guarda su posición en la URL
(`?dia=<dayId>&ej=<dayExerciseId>`), así que moverse entre ejercicios es
navegación de verdad: el botón "atrás" funciona y cada slot se monta con estado
limpio.

### Autenticación

El JWT se guarda en una cookie **no httpOnly** llamada `fitfront_token`
(`lib/auth.ts`) — legible desde JS a propósito, para que el interceptor de axios
pueda reenviarla como header Bearer a la API, que está en otro origen (la cookie
en sí nunca llega a ese origen). `proxy.ts` solo chequea que la cookie *exista*
para proteger las rutas privadas y sacar de `/login` a quien ya entró; validar
el JWT de verdad es trabajo de la API (responde 401). Después del login,
`use-auth` hace un `window.location.assign("/")` duro (no `router.replace`) para
que el proxy vea la cookie recién puesta.

### Capa de mocks (temporal)

`lib/mocks/auth-mock.ts` se instala en `lib/api.ts` solo cuando
`NEXT_PUBLIC_USE_MOCKS=true`. Falsea `/auth/login` y `/auth/me` con usuarios
hardcodeados y delega todo lo demás al adapter real — una salida de emergencia
para trabajar sin backend. En desarrollo normal la bandera está en `false`.

`docs/API-CONTRACT.md` es la especificación compartida con el repo del backend,
incluidos los temas abiertos (alcance de las sesiones entre entrenador y
cliente, ver la rutina de un cliente).

## Convenciones

- Alias de rutas `@/*` → raíz del repo. shadcn/ui en `components/ui` (estilo
  `radix-nova`, RSC habilitado, íconos de lucide) — sumá componentes con la CLI
  de `shadcn` en vez de escribirlos a mano.
- **Sistema de diseño** (`app/globals.css`): tema solo oscuro (el bloque `.dark`
  replica `:root`), colores en `oklch`, acento cian `--primary` + ámbar
  `--ember`. Tipografías por rol: **Anton** (`font-display`, títulos en
  mayúscula), **Geist** sans, **Geist Mono** (`font-mono`, muy usada en labels y
  eyebrows con tracking ancho). Mantené la estética gimnasio/editorial —
  eyebrows en mono y mayúscula, subrayados punteados, tracking — y no una UI
  neutra genérica.
