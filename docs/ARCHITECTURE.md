# ARCHITECTURE.md — Decisiones arquitectónicas

## Stack

- **Next.js 14 App Router** (se planea upgrade a 16 por CVEs).
- **TypeScript `strict`.**
- **Prisma 6 + PostgreSQL** (Railway).
- **NextAuth v5 beta** con JWT + Credentials (sin PrismaAdapter — se omitió para reducir tamaño del middleware edge).
- **Zustand** para estado cliente (8 stores por dominio).
- **Tailwind + Recharts + Lucide** para UI.
- **Zod** para validación de entrada.
- **Vitest** para unit tests; Playwright pendiente para E2E.

## Decisiones clave

### 1. JWT en vez de DB sessions

**Por qué:** Evita lookup de sesión por request (latencia Railway) y mantiene el middleware edge ligero (<1MB).
**Trade-off:** invalidar una sesión requiere rotar `NEXTAUTH_SECRET` (nuclear).

### 2. Middleware edge ligero sin NextAuth adapter

**Por qué:** `auth()` con PrismaAdapter supera el límite de 1MB en Edge Functions Vercel.
**Cómo:** middleware usa solo `getToken` de `next-auth/jwt` (no Prisma). Las route handlers (que corren en Node.js, no edge) sí usan `auth()` completo vía `withAuth`.

### 3. `withAuth` helper en lugar de middleware-based auth

**Por qué:** el middleware solo protege páginas (redirige a `/login`). Las API routes validan la sesión explícitamente vía `withAuth()` en el handler → permite respuestas JSON 401 consistentes.

### 4. Gamificación server-side

**Por qué:** XP y badges se otorgan en los route handlers de acciones (completar hábito, registrar PR, etc.). Cliente nunca incrementa XP — se actualiza leyendo de la DB después de la acción.
**Trade-off:** roundtrip extra por acción, pero inmune a manipulación cliente.

### 5. Stores Zustand por dominio (no global)

**Por qué:** cada módulo (habits, finance, etc.) tiene su propio store. Facilita test y evita re-renders innecesarios.

### 6. API RESTful clásica (no tRPC, no GraphQL)

**Por qué:** velocidad de desarrollo solo, simple de debuggear desde Network tab.
**Cuándo revisar:** si el catálogo crece >50 endpoints.

## Flujos críticos

### Login
1. POST a `/api/auth/callback/credentials` con email+password.
2. `authorize()` en `src/auth.ts` hace `bcrypt.compare`.
3. Si OK, NextAuth firma un JWT → setea cookie.
4. `/api/auth/session` devuelve sesión al cliente.

### Crear hábito
1. POST `/api/habits` con `withAuth` → userId validado.
2. Zod valida body.
3. Prisma insert con `userId`.
4. Si completado hoy, route handler de `/api/habits/[id]/logs` otorga +5 XP server-side.

## Carpetas especiales

- `_legacy/` (root del workspace, no en git) — prototipos históricos.
- `docs/` — documentación viva (este archivo).
- `.claude/` — skills, agents, commands para Claude Code.
