# Migración Railway → Neon

**Fecha:** 2026-04-20
**Commit:** `2d6fac4`

## Resumen

Migramos la DB de Postgres de Railway (free tier, conexiones limitadas) a Neon (pooling nativo, autoscaling, branching). Motivo: los tests E2E y la carga proyectada saturaban el pool de Railway ("too many clients already").

## Connection strings

| Nombre | Uso | Hostname |
|---|---|---|
| `DATABASE_URL` | Runtime (app + Prisma client) | `ep-blue-forest-amxqkubz-pooler.c-5.us-east-1.aws.neon.tech` (**pooled**) |
| `DIRECT_URL` | Migrations (`prisma migrate`) | `ep-blue-forest-amxqkubz.c-5.us-east-1.aws.neon.tech` (**direct**) |

## Verificación post-migración

✅ Counts idénticos Railway vs Neon en: User, Habit, HabitLog, Workout, Transaction, MoodLog, SleepLog, Project, ProjectTask, Note, LifeArea, Exercise, UserProfile, Gamification.

✅ 50 queries concurrentes vía pooled: 2 segundos (~40ms/query en paralelo). Railway se saturaba en 5-10 queries.

✅ Postgres 16.12 en Neon, mismo major version que Railway.

## Rollback a Railway (si algo falla)

Railway **sigue vivo** durante 7 días después de esta migración (no la cancelamos aún).

Para revertir:

1. **En Vercel → Settings → Environment Variables:**
   - `DATABASE_URL` → cambia al value de Railway:
     ```
     postgresql://postgres:IMgqfktEiUcLlhHANghqWWHIWGdMHyvA@shortline.proxy.rlwy.net:20997/railway
     ```
   - `DIRECT_URL` → borra (Railway no lo necesita)

2. **Redeploy.**

3. **Local:** revert `.env.local` o usa la línea `OLD_DATABASE_URL` comentada.

**Datos nuevos creados en Neon después de la migración NO se replican a Railway.** Si hay rollback, esos datos quedan huérfanos en Neon hasta que se borre el proyecto.

## Backup

Backup completo pre-migración en:
```
backups/railway_20260420_090929.sql (94KB, 50 tablas)
```

Restaurable a cualquier Postgres 16 con:
```bash
psql "$CONNECTION_STRING" -f backups/railway_20260420_090929.sql
```

## Qué cambió en el código

### `prisma/schema.prisma`
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // <-- nuevo
}
```

El `directUrl` lo usa solo `prisma migrate` (que necesita conexión directa sin pooling porque ejecuta statements `ALTER` en transacciones largas). Para runtime queries, Prisma sigue usando `url`.

### `.env.local` y Vercel env vars
- `DATABASE_URL` apunta al **pooled** endpoint (con `-pooler` en hostname)
- Nueva variable `DIRECT_URL` apunta al **direct** endpoint (sin `-pooler`)

## Sabores de Neon que estamos usando

- **Free tier:** 0.5GB storage, 190 hours compute/mes, 10 branches por proyecto
- **Autoscaling:** el compute escala hasta 2 CU automáticamente según carga
- **Scales to zero:** después de 5 min sin actividad, la DB se "duerme" (sin costo). Primer query después despierta en ~500ms (cold start)
- **Connection pooling:** PgBouncer nativo, max 10,000 connections en pooled

## Monitoring post-migración

### Qué revisar las próximas 48h:

1. **Sentry** → cualquier error nuevo de `PrismaClientInitializationError` o timeout
2. **Vercel Runtime Logs** → que las APIs de auth/profile/etc respondan 2xx
3. **Neon dashboard** → `Monitoring` tab, ver compute hours consumed
4. **Railway dashboard** → ver que no haya queries llegando (si aún llegan, significa que alguna env var no se cambió)

### Alerta temprana: si algo falla

Si algún endpoint da 500 post-migración, es casi seguro:
- `DATABASE_URL` mal pegada en Vercel (espacios, comillas)
- `DIRECT_URL` no añadida
- Connection limit alcanzado en Neon free (improbable, son 10k)

Rollback takes 2 minutes.

## Plan de corte de Railway

**Día 0 (hoy):** ambas DBs activas, Neon es la primaria.
**Día +7:** si cero incidentes → pausar Railway project (no borrar, solo pausar).
**Día +30:** si todo sigue OK → borrar Railway project definitivamente.

## Costos proyectados

- **Neon free:** suficiente para beta con <1000 usuarios activos
- **Upgrade path:** Neon Launch ($19/mes) cuando cruces:
  - 500MB storage (unlikely con pocos usuarios)
  - 190 compute hours/mes
  - Necesitas staging branches permanentes
