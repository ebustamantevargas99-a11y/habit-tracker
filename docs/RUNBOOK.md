# RUNBOOK.md — Deploy, rollback, on-call

## Deploy

### Automático (Vercel)
- `git push origin main` → Vercel detecta y despliega.
- Build corre `prisma generate && next build`.
- Migraciones Prisma NO se aplican en el build de Vercel.

### Migraciones DB
Manuales desde tu máquina contra la DB de producción (Railway):

```bash
# local → conectado a DB prod
DATABASE_URL="<prod url>" npx prisma migrate deploy
```

**Antes de correr:** revisar el SQL de la migración en `prisma/migrations/<timestamp>/migration.sql`.

### Variables de entorno en Vercel
- `DATABASE_URL`
- `AUTH_SECRET` (o `NEXTAUTH_SECRET` para beta antiguos)
- `AUTH_URL` (o `NEXTAUTH_URL`) = https://habit-tracker-two-flame.vercel.app

## Rollback

### Rollback de deploy
- Vercel dashboard → Deployments → click en deploy anterior → "Promote to Production".

### Rollback de migración
Prisma no tiene `down` automático. Opciones:
1. **Preferida**: crear migración nueva que revierta (forward-only).
2. **Emergencia**: restaurar snapshot de Railway (Railway → Database → Backups).

## On-call checklist

1. **Error >10/min en Sentry** (cuando esté integrado):
   - Ver traza y ruta afectada.
   - Si es un deploy reciente → rollback Vercel.
   - Si es DB → ver Railway metrics.

2. **Login no funciona**:
   - Verificar `AUTH_SECRET` en Vercel env vars.
   - Verificar que cookie `__Secure-authjs.session-token` se setea (DevTools → Application → Cookies).
   - Si se rotó `AUTH_SECRET`, todas las sesiones están invalidadas (esto es esperado).

3. **DB down**:
   - Railway status page.
   - App debe mostrar página de error (`error.tsx` — TODO implementar).

4. **Rate limit falso positivo** (cuando esté implementado):
   - Upstash dashboard → ver keys.
   - Limpiar key específica por IP si fue error.

## Healthcheck

- GET `https://habit-tracker-two-flame.vercel.app/api/auth/session` debe responder `{}` o sesión.
- Pendiente: endpoint `/api/health` dedicado.

## Contactos

- Railway support: support@railway.app
- Vercel support: via dashboard chat
- Owner: Eduardo (grupobustamante99@gmail.com)
