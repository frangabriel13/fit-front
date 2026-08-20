# 🗺️ Migración mock → backend

Mapa para pasar las pantallas de **datos hardcodeados** a **datos reales de la API**.
Orden de trabajo: **Login → Inicio → Rutina → Rutina/Entrenar**.

> Este archivo es el tablero. Se va tildando a medida que se completa cada paso.
> Sirve, además, para comunicarle al backend **qué endpoints y qué campos** tiene que ir construyendo.

---

## Cómo leer este documento

**Estados**
- `[ ]` pendiente · `[~]` en progreso · `[x]` hecho

**Responsable de cada tarea**
- **[FE]** lo hace el frontend (este repo)
- **[BE]** lo hace el backend (la API NestJS)
- **[FE+BE]** requiere acuerdo de contrato entre ambos

**Convención del proyecto**: el FE no inventa el contrato. Cada vez que el FE necesita
un dato nuevo, abajo está descrito con su **forma exacta** (endpoint, request, response) para
que el BE lo implemente igual. Hoy el FE habla con `types/api.ts` — ese archivo es el espejo
del contrato y se actualiza junto con el backend.

---

## 📌 Punto de partida (lo que ya existe hoy)

Esto es importante para no rehacer trabajo:

- **La capa de datos del FE ya está construida y cableada** contra la API real:
  `lib/api.ts` (axios + JWT + manejo de 401), todos los `hooks/use-*.ts` (React Query),
  `lib/query-keys.ts` y `types/api.ts`. Hoy está **tapada por un mock** y por pantallas
  estáticas, pero el "cómo se pega a la API" ya está resuelto.
- **El login del FE ya funciona** end-to-end contra el contrato (`useLogin`/`useMe`, cookie,
  proxy de rutas privadas). Lo único que falta es que el backend exista y apagar el mock.
- **El modo entrenamiento real ya existe** en `/splits/[id]/days/[dayId]/workout`
  (`components/workout/workout-screen.tsx`) usando `hooks/use-sessions.ts`. Esa pantalla es la
  **referencia canónica** de cómo se persiste una sesión de entrenamiento. `/rutina/entrenar`
  (el mock lindo) hay que cablearlo reusando esos mismos hooks.

### Las dos realidades del proyecto

| | Realidad **viva** (API) | Realidad **mock** (a migrar) |
|---|---|---|
| Pantallas | `/login`, `/splits/[id]`, `/splits/.../workout` | `/` (Inicio), `/rutina`, `/rutina/entrenar`, `/progreso` |
| Datos | React Query → API | `lib/routine-data.ts` (hardcodeado) |
| Estado | CRUD real | sólo estado local en memoria |

> El home (`/`) hoy linkea a `/rutina` y `/progreso`, **no** a `/splits`. La migración consiste
> en conectar la realidad mock a la misma capa de datos que ya usa la realidad viva.

### El interruptor del mock

- `lib/mocks/auth-mock.ts` se instala en `lib/api.ts` **solo** cuando `NEXT_PUBLIC_USE_MOCKS=true`.
  Hoy en `.env.local` está en `true`: intercepta `/auth/*` con usuarios hardcodeados y, para
  cualquier otra ruta, **devuelve vacío sin pegarle a la red** (aísla todo el FE del backend).
- Para empezar a usar backend real: poner `NEXT_PUBLIC_USE_MOCKS=false` (o borrar `lib/mocks/`
  y su import en `lib/api.ts`). Con eso, `NEXT_PUBLIC_API_URL` empieza a recibir tráfico real.

---

## 🔌 FASE 0 — Prerrequisitos transversales (BE)

Sin esto, ninguna pantalla funciona. Es lo primero que el backend tiene que dejar listo.

- [ ] **[BE]** API NestJS levantada y accesible en la URL de `NEXT_PUBLIC_API_URL` (hoy `http://localhost:3000`).
- [ ] **[BE]** **CORS**: permitir el origen del front (`http://localhost:3002` en dev) y aceptar el header `Authorization`.
- [ ] **[BE]** **Auth JWT por Bearer header**: cada request privada llega con `Authorization: Bearer <token>`. El backend valida el JWT y responde **401** si es inválido/expiró (el FE ya escucha el 401 y redirige a `/login`).
- [ ] **[BE]** Forma de error consistente (al menos status HTTP correctos: 401 no autenticado, 403 sin permiso, 404 no existe, 400/422 validación).
- [ ] **[FE]** Apagar el mock: `NEXT_PUBLIC_USE_MOCKS=false` en `.env.local` (hacerlo recién cuando `/auth/*` exista, ver Login).

---

## 🧩 Contrato de datos — gaps a resolver (FE+BE)

> **Esta es la sección más importante para el backend.** El diseño de las pantallas mock necesita
> campos que la API **todavía no tiene**. Antes (o en paralelo) de cablear Rutina/Entrenar hay que
> decidir y agregar estos campos. Cada uno está marcado con la pantalla que lo necesita.

Modelo de dominio actual: `Split → Microcycle → Day → DayExercise`, y por día `WorkoutSession → SetLog[]`.

| # | Necesidad (pantalla) | Mock usa | API hoy (`types/api.ts`) | Acción para el BE |
|---|---|---|---|---|
| C1 | **"Mi rutina" / split del usuario** (Rutina, Inicio, Entrenar) | un único `ROUTINE` | `GET /splits` (lista cruda) | Definir cómo el usuario logueado obtiene **su** rutina activa. Ver **D1**. |
| C2 | **Reps objetivo** (Rutina, Entrenar) | `reps: "10 a 12"` | ❌ no existe | Agregar `targetReps` a `DayExercise`. Ver **D2** (rango vs número). |
| C3 | **Esfuerzo objetivo** (Rutina, Entrenar) | `effort: "1 a 0"`, `"0 o fallo"` | `targetRir?: number` | Decidir si RIR es rango/`"fallo"`. Ver **D2**. |
| C4 | **Superseries / biseries** (Rutina, Entrenar) | `superset?: "ss1"` | ❌ no existe | Agregar agrupación a `DayExercise` (`supersetGroup` o similar). Ver **D3**. |
| C5 | **Serie "omitida"** (Rutina, Entrenar) | `status: done\|skipped\|pending` | `SetLog.completed: boolean` | Distinguir *omitida* de *pendiente*. Ver **D4**. |
| C6 | **Semana / posición del macrociclo** (Rutina) | `MACROCYCLE {week, totalWeeks}` | microciclos ordenados | Definir qué es "la semana actual". Ver **D5**. |
| C7 | **Historial por ejercicio** (Rutina, Entrenar) | `HISTORY[name].weeks[][]` | derivable de sessions | Confirmar si alcanza derivar de sessions o conviene endpoint dedicado. Ver **D6**. |
| C8 | **Foco del día** (Rutina) | `focus: "Glúteo · Cuádriceps"` | ❌ no existe | *Nice-to-have*: `focus`/grupos en `Day`. |

Las **decisiones D1–D6** están al final del documento — son las preguntas concretas para llevar a la reunión con el backend.

---

## 1) 🔐 LOGIN

**Ruta:** `/login` · **Estado FE:** prácticamente listo · **Bloqueante:** backend `/auth/*`.

### Qué pasa hoy
El formulario (`components/auth/login-form.tsx`) ya llama a `useLogin` → `POST /auth/login`,
guarda el `accessToken` en cookie (`fitfront_token`), cachea el user, y hace `window.location.assign("/")`.
`proxy.ts` protege las rutas privadas por presencia de la cookie. Todo esto **funciona contra el mock**.

### Backend — lo que falta
- [ ] **[BE]** `POST /auth/login`
  - **Request:** `{ "email": string, "password": string }`
  - **Response 200:** `{ "accessToken": string, "user": { "id": string, "email": string, "name": string } }`
  - **Response 401:** credenciales inválidas (el FE muestra "Email o contraseña incorrectos").
- [ ] **[BE]** `GET /auth/me` (con `Authorization: Bearer <token>`)
  - **Response 200:** `{ "id": string, "email": string, "name": string }`
  - **Response 401:** token inválido/expirado.
- [ ] **[BE]** Existencia de usuarios reales (reemplaza a los hardcodeados del mock: Franco y Diamela).

### Frontend
- [x] **[FE]** Formulario, validación (zod), estados de carga/error, caps-lock, mostrar/ocultar password.
- [x] **[FE]** `useLogin` / `useMe` / `useLogout`, cookie, interceptor 401, proxy de rutas.
- [ ] **[FE]** Apagar el mock (`NEXT_PUBLIC_USE_MOCKS=false`) y verificar login real.
- [ ] **[FE]** (al cerrar la migración) borrar `lib/mocks/` y su import en `lib/api.ts`.

### ✅ Definition of Done
Con `NEXT_PUBLIC_USE_MOCKS=false`: ingresar con un usuario real loguea, redirige a `/`, el header
muestra el nombre real, recargar mantiene la sesión y `Cerrar sesión` vuelve a `/login`.

---

## 2) 🏠 INICIO

**Ruta:** `/` · **Estado FE:** estático (hub de navegación) · **Bloqueante:** sólo `/auth/me` para lo básico.

### Qué pasa hoy
Dos tarjetas (`SectionCard`) que linkean a `/progreso` y `/rutina`. El `AppHeader` ya muestra
`useMe().name`. No hay otra lógica.

### Alcance de la migración
**Mínimo (recomendado para esta fase):** que el saludo/nombre sea real (ya lo es vía `useMe`) y que
la navegación quede correcta. No requiere endpoints nuevos más allá de `/auth/me`.

**Enriquecido (opcional, se puede dejar para después):** una tarjeta "Continuar / Hoy" que muestre el
día de entrenamiento de hoy y el progreso de la sesión en curso. Esto reusa exactamente los mismos
datos que **Rutina** y **Entrenar** (split activo + sesión de hoy), así que conviene hacerlo *después*
de tener Rutina andando.

### Backend
- [ ] **[BE]** `GET /auth/me` (mismo de Login; ya cubierto).
- [ ] **[BE]** *(sólo si se hace la versión enriquecida)* split activo + sesión de hoy → ver **Rutina**/**Entrenar** y **D1**.

### Frontend
- [x] **[FE]** Header con nombre del usuario (`useMe`).
- [ ] **[FE]** Verificar que con backend real el nombre y la navegación funcionan.
- [ ] **[FE]** *(opcional)* Tarjeta "Hoy/Continuar" alimentada por el split activo + sesión de hoy.

### ✅ Definition of Done
La home carga logueado, muestra el nombre real y navega a Rutina/Progreso. (Si se hace la versión
enriquecida: la tarjeta "Hoy" refleja el día y el progreso reales.)

---

## 3) 📋 RUTINA

**Ruta:** `/rutina` · **Estado FE:** 100% mock (`lib/routine-data.ts`) · **Bloqueante:** decisiones de contrato C1–C8.

Es la pantalla más rica del mock: tabs por día, planilla de ejercicios (series/reps/RIR/descanso),
detalle expandible con "Hoy vs. semana anterior", riel de progresión y barra de semanas del macrociclo.

### Qué pasa hoy
`RoutineView` lee de `lib/routine-data.ts`: `ROUTINE` (días + ejercicios), `SESSION` (sesión de hoy
mock), `HISTORY` (progresión por ejercicio) y `MACROCYCLE` (`{week, totalWeeks}`). Las superseries
salen del campo `superset` y se arman en `sheet-bits.tsx` (`toSheetItems`).

### Backend — lo que falta
- [ ] **[BE]** **Split activo del usuario** (C1/D1). Endpoint propuesto:
  - `GET /me/active-split` → `Split` (con `microcycles → days → exercises` anidado, como ya devuelve `GET /splits/:id`).
  - *(alternativa)* un flag/relación de asignación en `GET /splits` filtrable por usuario.
- [ ] **[BE]** `targetReps` en `DayExercise` (C2/D2).
- [ ] **[BE]** Definir RIR objetivo (rango / "fallo") (C3/D2).
- [ ] **[BE]** Agrupación de superseries en `DayExercise` (C4/D3).
- [ ] **[BE]** Foco/grupos musculares del día (C8) — *nice-to-have*.
- [ ] **[BE]** Posición de macrociclo: cómo se determina la "semana actual" y el total (C6/D5).
- [ ] **[BE]** Historial por ejercicio para "Hoy vs. semana anterior" y el riel de progresión (C7/D6):
  - Reusable hoy: `GET /days/:dayId/sessions` (ya existe) → derivar del listado de `SetLog`.
  - *(alternativa más limpia)* `GET /day-exercises/:id/history` con el top set por semana.

### Frontend
- [ ] **[FE]** Hook nuevo `useActiveSplit()` (en `hooks/use-splits.ts` o `hooks/use-routine.ts`) que pegue al endpoint de split activo. Agregar su query key en `lib/query-keys.ts`.
- [ ] **[FE]** Actualizar `types/api.ts` con los campos nuevos (`targetReps`, agrupación de superserie, foco) cuando el BE los confirme.
- [ ] **[FE]** Migrar `RoutineView` para consumir el `Split` real en vez de `ROUTINE`. Mapear:
  - `targetRestSeconds` (número) → texto de descanso (`240` → `4'`).
  - campo de superserie → lo que hoy espera `toSheetItems` (`superset`).
  - `targetReps`/`targetRir` → columnas reps/RIR.
- [ ] **[FE]** Sesión de hoy real: por cada día, derivar estado `done/skipped/pending` desde `WorkoutSession`+`SetLog` (reusar lógica de `workout-screen.tsx`).
- [ ] **[FE]** Historial/progresión (`ProgressionRail`, "Sem. anterior") desde el historial real.
- [ ] **[FE]** Barra de semanas del macrociclo desde la posición real (C6).
- [ ] **[FE]** Estados de **carga** (skeletons), **vacío** ("todavía no tenés rutina asignada") y **error**.
- [ ] **[FE]** Conectar acciones que hoy son visuales: "Reiniciar", "No realizado", botón Entrenar (debe llevar el `dayId` real — ver Entrenar).
- [ ] **[FE]** Al terminar: quitar imports de `lib/routine-data.ts` en esta pantalla.

### ✅ Definition of Done
`/rutina` muestra la rutina **asignada al usuario logueado** con sus días/ejercicios reales,
el estado de la sesión de hoy, la progresión real por ejercicio y la semana real del macrociclo;
con estados de carga/vacío/error. Sin lecturas de `routine-data.ts`.

---

## 4) 🏋️ RUTINA / ENTRENAR

**Ruta:** `/rutina/entrenar` · **Estado FE:** interactivo pero **solo en memoria** · **Bloqueante:** C1–C5 + ruteo del día.

### Qué pasa hoy
`EntrenarClient` deriva el plan de `ROUTINE` + `WORKOUT_POSITION` (un puntero hardcodeado al día y
ejercicio). Tiene steppers de peso/reps/RIR, completar/omitir, descanso con temporizador y registro
por serie/vuelta — **todo se pierde al recargar**. No hay `dayId` en la ruta.

### Buena noticia: gran parte del backend ya existe
El modo entrenamiento real (`workout-screen.tsx`) ya persiste con estos endpoints **ya implementados
en el contrato del FE** (`hooks/use-sessions.ts`):
- `GET /days/:dayId/sessions` — sesiones del día (para reanudar la de hoy).
- `POST /days/:dayId/sessions` — crear/empezar sesión.
- `GET /sessions/:id` — sesión con sus `setLogs`.
- `PUT /sessions/:id/set-logs` — **upsert en lote** de set-logs (guardado optimista por `dayExerciseId:setNumber`).
- `PATCH /set-logs/:id` — edición puntual.

### Backend — lo que falta
- [ ] **[BE]** Confirmar que esos 5 endpoints de sesiones existen y matchean el contrato (`types/api.ts`).
- [ ] **[BE]** Estado **"omitida"** en `SetLog` (C5/D4): hoy sólo hay `completed: boolean`. El UI de entrenar distingue *omitida* (`skipped`) de *pendiente*.
- [ ] **[BE]** `targetReps`, RIR objetivo y superseries (C2/C3/C4) — los mismos que Rutina; acá se usan para prellenar y para el flujo de biserie (A→B→A→B).
- [ ] **[BE]** (si aplica) que la sesión devuelva `performedAt`/hora de inicio (ya está en `WorkoutSession.performedAt`).

### Frontend
- [ ] **[FE+BE]** Definir **cómo se identifica el día a entrenar** (ruteo). Hoy no hay `dayId`. Opciones: `/rutina/entrenar?day=<dayId>`, o `/rutina/[dayId]/entrenar`, o "día de hoy" derivado. **Decisión D7.**
- [ ] **[FE]** Reescribir `EntrenarClient` para, en vez de estado local puro, usar `use-sessions` igual que `workout-screen.tsx`: crear/reanudar la sesión de hoy, sembrar la grilla desde `setLogs`, y guardar con `PUT /sessions/:id/set-logs` (debounce + guardado inmediato al completar).
- [ ] **[FE]** Mapear el estado de set (`done/skipped/pending`) contra el contrato real (depende de D4).
- [ ] **[FE]** Mantener la UX del mock (steppers, temporizador de descanso, biserie) sobre datos reales.
- [ ] **[FE]** Prefill (overload): última serie hecha / semana anterior, desde el historial real.
- [ ] **[FE]** Estados de carga/guardando/error (reusar `SaveIndicator`).
- [ ] **[FE]** Al terminar: quitar imports de `lib/routine-data.ts` y el puntero `WORKOUT_POSITION`.

### ✅ Definition of Done
Entrar a Entrenar para un día real crea/reanuda la sesión de hoy, los pesos/reps/RIR se **persisten**
(recargar no pierde nada), completar/omitir series se refleja en el backend, y el descanso/biserie
siguen funcionando como en el mock.

---

## ❓ Decisiones para llevar al backend (D1–D7)

Estas son las preguntas concretas que destraban la migración. Conviene cerrarlas antes de Rutina/Entrenar.

- [ ] **D1 — ¿Cómo obtiene el usuario "su" rutina?**
  ¿El modelo es entrenador↔cliente (Franco arma splits y se los asigna a clientes como Diamela)?
  Si es así, necesitamos "split activo/asignado del usuario logueado". Propuesta: `GET /me/active-split`.
  Definir qué pasa si el usuario tiene varias o ninguna.
- [ ] **D2 — Reps y RIR objetivo: ¿número o rango?**
  El diseño muestra `"10 a 12"` reps y `"1 a 0"` / `"0 o fallo"` de RIR. ¿`DayExercise` guarda
  `targetReps`/`targetRir` como número único, como `min`/`max`, o como string libre? (Definir también "fallo").
- [ ] **D3 — Superseries / biseries.**
  ¿Cómo se agrupan ejercicios consecutivos enlazados? Propuesta: campo `supersetGroup: string | null`
  (mismo valor = mismo grupo) en `DayExercise`, respetando `order`. El FE ya sabe armar A/B desde eso.
- [ ] **D4 — Estado de la serie: `completed` vs `skipped`.**
  Hoy `SetLog.completed: boolean`. El UI necesita distinguir *omitida* de *pendiente*. Propuesta:
  agregar `skipped: boolean` o un `status: "pending" | "done" | "skipped"`.
- [ ] **D5 — Semana / macrociclo.**
  ¿Un `Microcycle` representa **una semana** del macrociclo (y la "semana actual" es el microciclo
  en curso)? ¿O hay un set de días que se repite N semanas y la progresión es emergente de las sesiones?
  Definir de dónde sale `week` y `totalWeeks`.
- [ ] **D6 — Historial por ejercicio.**
  Para "Hoy vs. semana anterior" y el riel de progresión, ¿alcanza con derivar de `GET /days/:dayId/sessions`,
  o conviene un endpoint dedicado tipo `GET /day-exercises/:id/history` con el top set por semana?
- [ ] **D7 — Ruteo del modo entrenamiento.**
  ¿Cómo se entra a entrenar un día? (`/rutina/entrenar?day=<dayId>`, `/rutina/[dayId]/entrenar`, o
  "día de hoy" automático). Afecta links de Rutina e Inicio.

---

## 🧭 Orden recomendado de ejecución

1. **FASE 0** (BE): API arriba, CORS, JWT/401. *(Desbloquea todo.)*
2. **Login** (BE `/auth/*` → FE apaga el mock). *(Pantalla 1 funcional.)*
3. **Inicio** (versión mínima: ya queda con el login real). *(Pantalla 2 funcional.)*
4. **Cerrar decisiones D1–D7** con el backend. *(Destraba Rutina/Entrenar.)*
5. **Contrato C1–C8** (BE agrega campos; FE actualiza `types/api.ts`).
6. **Rutina** (FE consume split activo + sesión + historial reales). *(Pantalla 3 funcional.)*
7. **Rutina/Entrenar** (FE cablea `use-sessions`; persistencia real). *(Pantalla 4 funcional.)*
8. **Limpieza final**: borrar `lib/mocks/`, su import en `lib/api.ts`, y `lib/routine-data.ts`; quitar `NEXT_PUBLIC_USE_MOCKS`.

---

## 🧹 Checklist de limpieza (al final de todo)

- [ ] **[FE]** `NEXT_PUBLIC_USE_MOCKS=false` y luego eliminar la variable de `.env.local`/`.env.example`.
- [ ] **[FE]** Borrar `lib/mocks/` y su import + bloque condicional en `lib/api.ts`.
- [ ] **[FE]** Borrar `lib/routine-data.ts` (y sus imports en `components/routine/*`).
- [ ] **[FE]** Revisar que `app/progreso` (fuera de este alcance) no quede dependiendo de datos borrados.
- [ ] **[FE]** Actualizar `CLAUDE.md`/`AGENTS.md`: ya no hay "dos realidades" ni capa de mock.
</content>
</invoke>
