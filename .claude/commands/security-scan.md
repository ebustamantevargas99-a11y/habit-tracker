---
description: Audita el repo completo buscando vulnerabilidades de seguridad críticas — IDOR, input sin Zod, secretos, y uso inseguro de auth
argument-hint: [carpeta opcional, ej: src/app/api/finance]
---

# /security-scan

Ejecuta una auditoría de seguridad del proyecto. Usa el agente `security-reviewer` para análisis profundo.

## Pasos

1. Si se pasó argumento `$1`, limita el scan a esa ruta. Si no, revisa `src/app/api/**`, `src/middleware.ts`, `src/auth.ts`, `next.config.js`.

2. Lanza el agente `security-reviewer` en paralelo por dominio (finance, fitness, wellness, auth). Cada agente revisa su dominio y reporta hallazgos con `file:line`.

3. Corre `npm audit --production` y resume CVEs.

4. Grep rápido de patrones peligrosos:
   - `$queryRawUnsafe`, `dangerouslySetInnerHTML`, `eval(`
   - `parseFloat(` sin Zod alrededor (puede ser número negativo)
   - `prisma\.[a-z]+\.(update|delete)\(\s*{\s*where:\s*{\s*id:` sin userId

5. Consolida reporte único con todas las fuentes:
   - Severidad (CRÍTICA / ALTA / MEDIA / BAJA)
   - Archivo:línea
   - Problema + fix

## Criterio de aprobación

- 0 CRÍTICA
- 0 ALTA (o justificadas)
- `npm audit` sin high/critical

Si hay bloqueadores, muéstralos como checklist. No arregles automáticamente — el usuario decide qué prioritizar.
