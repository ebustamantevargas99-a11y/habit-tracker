# Sentry — integración futura

El stub en `src/lib/sentry.ts` hace log estructurado. Para activar Sentry real:

## Pasos

1. Crea cuenta en [sentry.io](https://sentry.io) → New Project → Next.js → copia el DSN.

2. Instala el SDK:
   ```bash
   npx @sentry/wizard@latest -i nextjs
   ```
   Esto crea automáticamente:
   - `sentry.client.config.ts`
   - `sentry.server.config.ts`
   - `sentry.edge.config.ts`
   - Actualiza `next.config.js` con `withSentryConfig`

3. En `.env.local` y Vercel env vars:
   ```
   SENTRY_DSN=https://...@sentry.io/...
   SENTRY_AUTH_TOKEN=...
   NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
   ```

4. Reemplaza el stub en `src/lib/sentry.ts`:
   ```ts
   import * as Sentry from "@sentry/nextjs";
   export const captureException = Sentry.captureException;
   export const captureMessage = Sentry.captureMessage;
   ```

5. Configura alertas en Sentry dashboard:
   - Errors > 10/min → email/slack
   - New error type → email

## Costos

- Free tier: 5K errores/mes, 7 días retention. Suficiente para beta.
- Team: $26/mes (si escalas).

## Qué loguea actualmente (sin Sentry)

Todo va a `logger.error`/`logger.warn` en [src/lib/logger.ts](../src/lib/logger.ts). En producción emite JSON estructurado a `console` → visible en Vercel Logs (`vercel logs` o Vercel dashboard).
