# Upstash Redis — rate limiting distribuido

El helper en [`src/lib/rate-limit.ts`](../src/lib/rate-limit.ts) detecta automáticamente si las env vars de Upstash están presentes y cambia a Redis distribuido. Si no están, usa fallback in-memory (funciona en dev; en prod Vercel cada deploy resetea los contadores por instancia).

## Por qué importa

El fallback in-memory:
- No es compartido entre múltiples instancias serverless (Vercel puede tener varias corriendo en paralelo)
- Se resetea en cada cold start
- Sirve para desarrollo local, no para proteger producción a escala

## Setup (5 minutos)

1. Crea cuenta gratis en [upstash.com](https://upstash.com) → Console → Create Database → Redis → Región cercana a Vercel (ej: `us-east-1`).

2. En el dashboard de la DB, copia:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

3. Pégalos en **Vercel → Project → Settings → Environment Variables** (Production + Preview).

4. También en tu `.env.local` para dev local (opcional):
   ```
   UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN=xxx
   ```

5. Redeploy Vercel. El helper detecta las vars automáticamente — no hay que cambiar código.

## Verificación

```bash
curl -X POST https://tu-app.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"bad@x","password":"weak"}'
# Repetir 6 veces rápido → la 6ª debe devolver 429 con header Retry-After
```

## Límites aplicados (ver [`rate-limit.ts`](../src/lib/rate-limit.ts))

| Acción | Límite | Ventana |
|---|---|---|
| `register` | 5 | 1 hora por IP |
| `login` | 10 | 5 min por IP |
| `apiMutation` | 120 | 1 min por IP (general) |
| `passwordReset` | 3 | 1 hora por IP |
| `accountDelete` | 3 | 1 hora por IP |

Para ajustar, edita el objeto `rateLimits` en `src/lib/rate-limit.ts`.

## Costos

Upstash free tier: 10k comandos/día, suficiente para ~2000 requests auth/día. Si escalas, $0.20/100k.
