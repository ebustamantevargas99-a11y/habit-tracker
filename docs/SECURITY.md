# SECURITY.md — Modelo de amenazas y políticas

## Secretos

| Secreto | Dónde vive | Cómo rotar |
|---|---|---|
| `DATABASE_URL` | Vercel env vars + Railway | Railway dashboard → DB → Rotate password → actualizar Vercel env |
| `NEXTAUTH_SECRET` / `AUTH_SECRET` | Vercel env vars | `openssl rand -base64 32` → update Vercel → redeploy (invalida todas las sesiones) |
| `NEXTAUTH_URL` / `AUTH_URL` | Vercel env vars | Solo cambiar si cambia el dominio de producción |

**Regla:** nunca commitear `.env*`. El repo solo tiene `.env.local.example` como template.

## Autenticación

- NextAuth v5 beta, estrategia JWT (sin PrismaAdapter).
- Credentials provider con bcrypt (rondas = 13).
- Sesiones: cookies `authjs.session-token` (dev) / `__Secure-authjs.session-token` (prod, HTTPS).
- Middleware `src/middleware.ts` valida JWT con `getToken` (no solo existencia).
- Toda ruta de API protegida con `withAuth()` → valida sesión con `auth()` de NextAuth.

## Autorización

- Modelo único: ownership por `userId`.
- Patrón obligatorio para mutaciones: `findFirst({ where: { id, userId } })` → verificar → mutar.
- Nunca `update/delete({ where: { id } })` sin ownership check previo.

## Validación de entrada

- Todo body JSON validado con Zod (`src/lib/validation/`).
- Helper `parseJson(req, schema)` retorna `{ ok, data }` o `{ ok: false, response }`.
- Montos financieros: `positiveNumber` schema (rechaza negativos, NaN, Infinity, y >1B).

## Headers HTTP (ver `next.config.js`)

- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Content-Security-Policy` restrictiva (scripts propios + Vercel analytics)

## Pendientes conocidos

- [ ] Rate limiting en `/api/auth/register` y `/api/auth/callback/credentials` (Upstash Redis).
- [ ] Upgrade Next 14.2 → 16 (5 CVEs high de DoS/request-smuggling).
- [ ] Audit IDOR completo de las 32 API routes (mayoría OK pero falta confirmar una por una).
- [ ] Campos sensibles: auditar `select` de Prisma para que nunca retornen `passwordHash`.
- [ ] Logging estructurado (sustituir `console.error` crudos).
- [ ] Paginación en endpoints grandes (export/ai-context).

## Reporte de vulnerabilidades

Si alguien externo encuentra una vulnerabilidad, debería reportarla a: _(definir email)_.
