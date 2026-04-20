---
description: Revisa los cambios pendientes (diff vs main) antes de abrir PR — seguridad, tests, calidad, y convenciones
---

# /review-pr

Checklist pre-PR completa.

## Pasos

1. **Estado del diff**:
   - `git status` y `git diff main...HEAD --stat`
   - Resumir: qué carpetas tocadas, cuántos archivos, líneas +/-.

2. **Seguridad** (invocar `/security-scan` o el agente `security-reviewer` sobre los archivos modificados).

3. **Calidad**:
   - `npm run lint` debe pasar.
   - `npm run test:run` debe pasar.
   - `npm run build` debe compilar.
   - Grep `any` en archivos modificados — si aumentaron, reportar.
   - Grep `console.log` — si aparecen, reportar.

4. **Convenciones**:
   - Todo endpoint nuevo usa `withAuth` + `parseJson` + ownership check.
   - No hay hardcoded URLs/secretos.
   - No hay archivos basura (`.bak`, `.tmp`, `test-*`).

5. **Tests**:
   - Features nuevas tienen al menos un test unitario en `src/test/`.
   - Si tocaste auth o middleware, debe haber test E2E (aunque sea TODO).

6. **Docs**:
   - Si añadiste una API route, ¿se documentó en `CLAUDE.md` o en un `docs/API.md`?
   - Si cambiaste convención, ¿se reflejó en `CLAUDE.md`?

## Output

Checklist con ✓ / ✗ / ⚠. Bloqueadores arriba. Sugerencias abajo. Si todo OK, sugerir comando de PR con título+descripción basada en el diff.
