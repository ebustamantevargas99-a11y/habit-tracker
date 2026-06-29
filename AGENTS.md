# AGENTS.md — Ultimate Tracker

> Pointer cross-tool (Cursor, Codex, Cline, Aider, etc.). La **fuente de verdad**
> para agentes en este repo es [`CLAUDE.md`](./CLAUDE.md); léela primero. Este
> archivo solo replica lo mínimo crítico para herramientas que únicamente
> leen `AGENTS.md`.

## Lo esencial

- **Qué es:** SaaS de seguimiento personal (hábitos, finanzas, fitness, wellness,
  productividad). Stack: Next.js 14 App Router, React 18, TypeScript `strict`,
  Prisma + PostgreSQL, NextAuth v5 (JWT), Zod, Tailwind. Rumbo a beta pública.
- **Instrucciones completas:** [`CLAUDE.md`](./CLAUDE.md)
- **Contrato de seguridad:** [`.claude/rules/security.md`](./.claude/rules/security.md)

## Reglas que ningún agente puede saltarse

1. Rutas protegidas con `withAuth()`; nunca `prisma` sin auth.
2. Filtrar por `userId` en todo recurso del usuario (ownership check).
3. Body siempre validado con Zod (`parseJson`), nunca `req.json()` directo.
4. bcrypt ≥ 13 rondas; nunca exponer `password`/`passwordHash` al cliente.
5. Nunca `$queryRawUnsafe`; nunca secretos en `NEXT_PUBLIC_*`; nunca commitear `.env*`.

## Comandos

```bash
npm run dev        # dev server (localhost:3000)
npm run build      # prisma generate + next build
npm run test:run   # Vitest (single run)
npm run lint       # next lint
```

Antes de un cambio grande o sensible: corre `/security-scan` (o revisión
equivalente) antes de commitear.
