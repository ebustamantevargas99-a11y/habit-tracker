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

1. **Toda ruta protegida usa `withAuth()`** de `src/lib/api-helpers.ts`. Nunca llames a `prisma` sin pasar por `withAuth` o `auth()`.
2. **Todo query Prisma que opera sobre recursos del usuario debe filtrar por `userId`** además del `id` del recurso. Patrón: `findFirst({ where: { id, userId } })` → `update/delete({ where: { id } })`. Nunca saltes el check de ownership.
3. **Todo endpoint que recibe body usa Zod** con `parseJson(req, schema)`. Nunca `await req.json()` directo.
4. **Passwords hasheadas con bcrypt, rondas ≥ 13.** Nunca MD5, SHA1, plain.
5. **Nunca expongas el campo `password`/`passwordHash`** en `select` de Prisma hacia el cliente.
6. **Nunca uses `$queryRawUnsafe`** ni concatenación en `$queryRaw`. Siempre parametrizado.
7. **Nunca pongas secretos en `NEXT_PUBLIC_*`.** Esas vars van al bundle cliente.
8. **Nunca commitees `.env*`** (ya está en `.gitignore`).

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
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(async (userId) => {
    const existing = await prisma.miModelo.findFirst({
      where: { id: params.id, userId },
    });
    if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

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

- Comandos disponibles en `.claude/commands/` (ej: `/security-scan`, `/new-feature`, `/review-pr`).
- Agentes especializados en `.claude/agents/` — el general-purpose los invoca automáticamente cuando hacen match.
- Skills reutilizables en `.claude/skills/`.

Si vas a hacer cambios grandes, ejecuta `/security-scan` antes de commitear.
