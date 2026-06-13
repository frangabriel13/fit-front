# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

> ⚠️ **Next.js 16, not the one you know.** APIs/conventions differ from training data.
> Before writing route/framework code, read the relevant guide in
> `node_modules/next/dist/docs/`. Notably: `proxy.ts` (not `middleware.ts`), and
> `params`/`searchParams` are `Promise`s you must `await`.

## Commands

- `npm run dev` — dev server on **port 3001** (`http://localhost:3001`)
- `npm run build` / `npm run start` — production build / serve (also 3001)
- `npm run lint` — ESLint (flat config; the command is plain `eslint`, not `next lint`)

There is no test runner configured.

## Environment

- `NEXT_PUBLIC_API_URL` — base URL of the external NestJS REST API, no trailing slash (e.g. `http://localhost:3000`).
- `NEXT_PUBLIC_USE_MOCKS` — when `"true"`, axios's adapter is intercepted to fake `/auth/*` so the app runs with no backend. **Temporary**; see "Mock layer" below.

The API must allow CORS from the front origin and accept the `Authorization` header.

## Architecture

A mobile-first fitness app (Spanish UI) that consumes an external NestJS REST API. Server state lives in TanStack Query; there is no app-level client store.

### Two parallel realities — know which one you're touching

1. **API-wired editor** (`app/splits/[id]`, `app/login`, `components/editor`, `components/auth`, `components/workout`, all `hooks/`). Real CRUD against the API via React Query. This is the working data layer.
2. **Static-mock UI** (`app/page.tsx` home, `app/rutina`, `app/progreso`, `components/routine`, `components/home`, `components/layout`). The home dashboard links to `/rutina` and `/progreso` — **not** to `/splits`. These screens are pure visual mocks reading hardcoded data from `lib/routine-data.ts` (`ROUTINE`, `SESSION`, `WORKOUT_POSITION`); they have **no backend logic** (`/rutina/entrenar` renders a fixed snapshot — change `WORKOUT_POSITION` to preview a different state). Interactivity arrives when wired to the API.

When asked to "add a feature to the workout/routine screen," confirm which reality: the live one (`/splits/.../workout` + `use-sessions`) or the mock one (`/rutina/entrenar` + `routine-data.ts`).

### Data layer

- `lib/api.ts` — single axios instance. Request interceptor attaches `Authorization: Bearer <token>`; response interceptor on `401` clears the token and hard-redirects to `/login`. `unwrap<T>()` strips `response.data` with typing.
- `hooks/use-*.ts` — one hook module per resource (`use-splits`, `use-microcycles`, `use-days`, `use-exercises`, `use-sessions`, `use-auth`). All `"use client"`. Mutations invalidate via the centralized key factory in `lib/query-keys.ts`. `use-sessions` does **optimistic** batch upserts (`PUT /sessions/:id/set-logs`) keyed by `dayExerciseId:setNumber`.
- `types/api.ts` — hand-maintained mirror of the API contract. `lib/schemas.ts` — zod v4 form schemas (used with react-hook-form via `@hookform/resolvers`); empty strings coerce to `undefined` for optional numeric/text inputs.

### Domain model (nested)

`Split → Microcycle → Day → DayExercise`, plus `WorkoutSession → SetLog[]` recorded per day. Entering the workout screen resumes today's session if one exists, else creates one.

### Auth

JWT is stored in a **non-httpOnly** cookie `fitfront_token` (`lib/auth.ts`) — deliberately readable by JS so the axios interceptor can forward it as a Bearer header to the cross-origin API (the cookie itself never reaches that origin). `proxy.ts` only checks the cookie's *presence* to gate private routes / bounce logged-in users off `/login`; real JWT validation is the API's job (it returns 401). After login, `use-auth` does a hard `window.location.assign("/")` (not `router.replace`) so the proxy sees the fresh cookie.

### Mock layer (temporary)

`lib/mocks/auth-mock.ts` is installed in `lib/api.ts` only when `NEXT_PUBLIC_USE_MOCKS=true`. It fakes `/auth/login` and `/auth/me` with hardcoded users and delegates everything else to the real adapter. The contract matches the real backend — to go live, set the flag to `false` (or delete `lib/mocks/` and its import in `lib/api.ts`). Likewise `lib/routine-data.ts` is placeholder data to be replaced by API calls.

## Conventions

- Path alias `@/*` → repo root. shadcn/ui under `components/ui` (style `radix-nova`, RSC enabled, lucide icons) — add components via the `shadcn` CLI rather than hand-rolling.
- **Design system** (`app/globals.css`): dark-only theme (the `.dark` block mirrors `:root`), colors in `oklch`, cyan `--primary` accent + amber `--ember`. Fonts by role: **Anton** (`font-display`, uppercase headings), **Geist** sans, **Geist Mono** (`font-mono`, used heavily for labels/eyebrows with wide tracking). Keep the gym/editorial aesthetic — uppercase mono eyebrows, dashed underlines, tracking — not a neutral generic UI.
