# CLAUDE.md — Ultimate Habit Tracker

Guía para Claude Code (y humanos) sobre cómo trabajar en este repositorio.

## Qué es este proyecto

SaaS de seguimiento personal (hábitos, finanzas, fitness, wellness, planner, productividad). Objetivo: lanzamiento público **beta gratuita**.

- **URL prod:** https://habit-tracker-two-flame.vercel.app
- **Repo:** https://github.com/ebustamantevargas99-a11y/habit-tracker
- **DB:** PostgreSQL en Railway
- **Hosting:** Vercel (free tier)

## Stack

- **Frontend:** Next.js 14 App Router, React 18, TypeScript `strict`
- **UI:** Tailwind CSS, Lucide, Recharts
- **Estado cliente:** Zustand (stores por dominio en `src/stores/`)
- **Backend:** Next.js Route Handlers en `src/app/api/`
- **ORM:** Prisma 6 + PostgreSQL
- **Auth:** NextAuth.js v5 beta (JWT, Credentials provider, sin Adapter)
- **Validación:** Zod (schemas en `src/lib/validation/`)
- **Tests:** Vitest (unit) — pendiente Playwright (E2E)

## Estructura

```
src/
├── app/
│   ├── api/            # 32 route handlers por dominio
│   ├── login/          # página de login
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/             # primitivos (Button, Card, Input)
│   ├── layout/         # Sidebar, TopBar, main-app
│   ├── charts/         # wrappers Recharts
│   └── features/       # UI por dominio (habits, finance, etc.)
├── stores/             # Zustand por dominio
├── lib/
│   ├── api-helpers.ts  # withAuth wrapper
│   ├── validation/     # schemas Zod
│   ├── prisma.ts       # Prisma singleton
│   └── ...
├── hooks/
├── types/
└── test/               # Vitest
```

## Convenciones obligatorias

### Seguridad (no negociable)

Las 8 reglas duras (detalle completo, enforcement automático y patrón de
ownership en el módulo `.claude/rules/security.md`, el mismo que usan
`/security-scan` y el agente `security-reviewer`):

1. `withAuth()` en toda ruta protegida — nunca `prisma` suelto.
2. Filtrar por `userId` en recursos del usuario (ownership check).
3. Zod + `parseJson(req, schema)` en todo body — nunca `req.json()` directo.
4. bcrypt rondas ≥ 13 — nunca MD5/SHA1/plain.
5. Nunca exponer `password`/`passwordHash` en `select`.
6. Nunca `$queryRawUnsafe` ni concatenación en `$queryRaw`.
7. Nunca secretos en `NEXT_PUBLIC_*`.
8. Nunca commitear `.env*` (el hook `block-sensitive-writes` lo bloquea).

@.claude/rules/security.md

### Código

- **TypeScript `strict`.** Evita `any`; si no queda más, comenta por qué.
- **No comentarios que describan el QUÉ.** Solo comenta el POR QUÉ cuando no es obvio.
- **Errores:** no devolver `error.message` crudo al cliente (puede leakear info). Loguear internamente, responder genérico.
- **Códigos HTTP:** 200/201 éxito, 400 validación, 401 no auth, 403 sin permiso, 404 no existe, 409 conflicto, 429 rate limit, 500 interno.

### Patrones

**Crear una API route nueva** (ejemplo POST protegido):

```ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, miSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, miSchema);
    if (!parsed.ok) return parsed.response;

    const record = await prisma.miModelo.create({
      data: { userId, ...parsed.data },
    });
    return NextResponse.json(record, { status: 201 });
  });
}
```

**Crear un endpoint `[id]` con ownership check:**

```ts
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId) => {
    const existing = await prisma.miModelo.findFirst({
      where: { id: params.id, userId },
    });
    if (!existing)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const parsed = await parseJson(req, miUpdateSchema);
    if (!parsed.ok) return parsed.response;

    const updated = await prisma.miModelo.update({
      where: { id: params.id },
      data: parsed.data,
    });
    return NextResponse.json(updated);
  });
}
```

## Comandos comunes

```bash
npm run dev            # dev server (http://localhost:3000)
npm run build          # prisma generate + next build
npm run test           # Vitest watch
npm run test:run       # Vitest single run
npm run db:migrate     # prisma migrate dev
npm run db:studio      # Prisma Studio GUI
npm run db:push        # push schema (dev only, sin migraciones)
npm run lint           # next lint
```

## Deuda técnica conocida

Ver [`docs/`](./docs/) para contexto:

- `PROJECT-BIBLE.md` — visión y roadmap (histórico, requiere actualización)
- `SECURITY.md` — modelo de amenazas (TODO)
- `ARCHITECTURE.md` — decisiones arquitectónicas (TODO)
- `RUNBOOK.md` — deploy, on-call, rollback (TODO)

**Pendientes críticos para lanzamiento público:**

- [ ] Upgrade Next 14.2 → 16 (CVEs high severity)
- [ ] Rate limiting en `/api/auth/*` (Upstash)
- [ ] IDOR audit completo de las 32 API routes
- [ ] `error.tsx`, `not-found.tsx`, `loading.tsx` en `src/app/`
- [ ] Integrar Sentry
- [ ] Playwright E2E (auth flow, CRUD crítico)
- [ ] Páginas legales (`/terms`, `/privacy`, `/cookies`)
- [ ] GDPR: endpoints export/delete user data
- [ ] CI con GitHub Actions

## Cosas a NO hacer

- No añadir features nuevos antes de cerrar los críticos arriba.
- No crear `README.md` adicionales en subcarpetas si no aportan.
- No duplicar lógica entre API routes — extrae a helpers en `src/lib/`.
- No usar `<img>` crudo — usa `next/image` cuando se añada assets.
- No usar `fetch` directo en componentes server — usa Prisma directo o `cache()`.
- No borrar nada en `_legacy/` del root sin consultar.

## Flujo de trabajo con Claude Code

Estructura `.claude/` (todo versionado salvo `settings.local.json`):

- **`commands/`** — slash commands: `/security-scan`, `/new-feature`, `/review-pr`.
- **`agents/`** — subagentes con contexto aislado: `security-reviewer`, `db-migration-helper`.
- **`skills/`** — skills auto-activadas por contexto: `add-api-route`.
- **`rules/`** — módulos de reglas importados con `@`: `security.md` (contrato de seguridad).
- **`hooks/`** — enforcement determinista vía shell. `block-sensitive-writes.cjs` (PreToolUse) bloquea escrituras a `.env*` y llaves privadas.
- **`settings.json`** — permisos `allow`/`deny` + wiring de hooks. Overrides personales en `settings.local.json` (gitignored).

`AGENTS.md` (raíz) es un pointer cross-tool para Cursor/Codex/Cline; la fuente de verdad sigue siendo este archivo.

Si vas a hacer cambios grandes, ejecuta `/security-scan` antes de commitear.
