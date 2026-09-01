# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

> ⚠️ **Next.js 16, not the one you know.** APIs/conventions differ from training data.
> Before writing route/framework code, read the relevant guide in
> `node_modules/next/dist/docs/`. Notably: `proxy.ts` (not `middleware.ts`), and
> `params`/`searchParams` are `Promise`s you must `await`.

## Commands

- `npm run dev` — dev server on **port 3002** (`http://localhost:3002`)
- `npm run build` / `npm run start` — production build / serve (also 3002)
- `npm run lint` — ESLint (flat config; the command is plain `eslint`, not `next lint`)
- `npm test` — Vitest, single run (`npm run test:watch` to watch)

Tests cover the **pure modules only**: the translation between what the API stores and what the planilla shows. That is what breaks silently. Most live in `lib/`, but two sit next to the components that consume them (`components/routine/entrenar/slots.ts`, `components/routine/sheet/set-delta.ts`), so `vitest.config.mts` collects `{lib,components}/**/*.test.ts` — by filename, not by folder. There are no component tests: rendering React would mean adding jsdom and a testing library, and none of the bugs so far lived there.

## Environment

- `NEXT_PUBLIC_API_URL` — base URL of the external NestJS REST API, no trailing slash (e.g. `http://localhost:3000`).
- `NEXT_PUBLIC_USE_MOCKS` — when `"true"`, axios's adapter is intercepted to fake `/auth/*` so the app runs with no backend. **Temporary**; see "Mock layer" below.

The API must allow CORS from the front origin and accept the `Authorization` header.

## Architecture

A mobile-first fitness app (Spanish UI) that consumes an external NestJS REST API. Server state lives in TanStack Query; there is no app-level client store.

### Two surfaces over one data layer

Every screen now reads from the API; there is no mock data module. What differs is the audience:

1. **Editor** (`app/splits/*`, `components/editor`, `components/splits`). CRUD over the nested model — build a routine, set its targets, and assign it to a client. Trainer-only (the API 403s a client on write). Reached from the header link, not from the home dashboard. `ExerciseRow` renders targets through `toPlanExercise`, so the editor shows the exact string the trainee will read.
2. **Trainee flow** (`app/rutina`, `app/rutina/entrenar`, `app/progreso`, `components/routine`, `components/progress`). Reads the same resources through `hooks/use-plan.ts` and renders them in the "planilla" idiom. This is the designed surface; the home dashboard links here.
3. **Trainer's view of a client** (`app/clientes/[id]`). Reuses the trainee components with `usePlan(clientId)` and `readOnly` — same screens, someone else's data, no way to train from there. Scoping is the backend's job; the frontend only says whose data it wants.

**There is one training screen: `/rutina/entrenar`.** A second one used to live under the editor (`components/workout`, a debounced grid); it was deleted because it logged sets against the *logged-in* user, so a trainer opening a client's day recorded the sets under their own name. What a trainer needs to see of a client is `/clientes/[id]`.

### The planilla layer

The API stores numbers; the screens speak abbreviations. Three pure modules do the translation and hold the domain vocabulary:

- `lib/plan.ts` — `DayExercise` → `PlanExercise`: rep/RIR ranges, `toFailure`, rest seconds → `"8-10"`, `"0-F"`, `"2'30''"`, plus `supersetGroup` → `superset`. Also `microcycleForWeek()`, which is how "the current week" becomes a set of days.
- `lib/sheet.ts` — numbering: one block per exercise, supersets share a number with an A/B suffix.
- `lib/set-logs.ts` — `SetLog` (two booleans) → `SetEntry` (one status: done / skipped / pending), and back.

Nothing above these modules should format a rep range or read `completed`/`skipped` directly.

### Data layer

- `lib/api.ts` — single axios instance. Request interceptor attaches `Authorization: Bearer <token>`; response interceptor on `401` clears the token and hard-redirects to `/login`. `unwrap<T>()` strips `response.data` with typing.
- `hooks/use-*.ts` — one hook module per resource (`use-splits`, `use-microcycles`, `use-days`, `use-exercises`, `use-sessions`, `use-progress`, `use-auth`). All `"use client"`. Mutations invalidate via the centralized key factory in `lib/query-keys.ts`. `use-sessions` does **optimistic** batch upserts (`PUT /sessions/:id/set-logs`) keyed by `dayExerciseId:setNumber`; optimistic rows carry a fake id (`OPTIMISTIC_ID_PREFIX`) that must never reach a `DELETE`.
- `hooks/use-plan.ts` — `usePlan(userId?)`, the composite the trainee screens use: splits → detail → progress, resolved to the current week's `PlanDay[]` plus history by exercise name. Takes the **first** split, which is enough: a user has exactly one assigned routine (product rule). The API names the same filter `clientId` on `/splits` and `userId` elsewhere; this hook hides that.
- `hooks/use-active-session.ts` — `useTodaysSession` reads today's session; `useActiveSession` creates one if missing. Viewing a routine must not open a session, so `/rutina` uses the read-only one and only `/rutina/entrenar` uses the creating one.
- `types/api.ts` — hand-maintained mirror of the API contract. `lib/schemas.ts` — zod v4 form schemas (used with react-hook-form via `@hookform/resolvers`); empty strings coerce to `undefined` for optional numeric/text inputs.

### Domain model (nested)

`Split → Microcycle → Day → DayExercise`, plus `WorkoutSession → SetLog[]` recorded per day. Entering the workout screen resumes today's session if one exists, else creates one. A Split is a macrocycle and a Microcycle is a week — `GET /splits/:id/progress` returns which week is current plus per-exercise history, and that is what drives both the week bar and the progression chart.

`/rutina/entrenar` keeps its position in the URL (`?dia=<dayId>&ej=<dayExerciseId>`), so moving between exercises is real navigation: back button works and each slot mounts with clean state.

### Auth

JWT is stored in a **non-httpOnly** cookie `fitfront_token` (`lib/auth.ts`) — deliberately readable by JS so the axios interceptor can forward it as a Bearer header to the cross-origin API (the cookie itself never reaches that origin). `proxy.ts` only checks the cookie's *presence* to gate private routes / bounce logged-in users off `/login`; real JWT validation is the API's job (it returns 401). After login, `use-auth` does a hard `window.location.assign("/")` (not `router.replace`) so the proxy sees the fresh cookie.

### Mock layer (temporary)

`lib/mocks/auth-mock.ts` is installed in `lib/api.ts` only when `NEXT_PUBLIC_USE_MOCKS=true`. It fakes `/auth/login` and `/auth/me` with hardcoded users and delegates everything else to the real adapter — an escape hatch for working with no backend. The flag is `false` in normal development.

`docs/API-CONTRACT.md` is the shared spec with the backend repo, including the open items (session scoping across trainer/client, viewing a client's routine).

## Conventions

- Path alias `@/*` → repo root. shadcn/ui under `components/ui` (style `radix-nova`, RSC enabled, lucide icons) — add components via the `shadcn` CLI rather than hand-rolling.
- **Design system** (`app/globals.css`): dark-only theme (the `.dark` block mirrors `:root`), colors in `oklch`, cyan `--primary` accent + amber `--ember`. Fonts by role: **Anton** (`font-display`, uppercase headings), **Geist** sans, **Geist Mono** (`font-mono`, used heavily for labels/eyebrows with wide tracking). Keep the gym/editorial aesthetic — uppercase mono eyebrows, dashed underlines, tracking — not a neutral generic UI.
