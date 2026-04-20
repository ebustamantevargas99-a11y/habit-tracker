# E2E tests (Playwright)

## Cómo correr

```bash
# primera vez: instalar navegadores
npx playwright install

# correr en local (levanta dev server automáticamente)
npm run test:e2e

# UI interactivo para debuggear
npm run test:e2e:ui
```

## Variables opcionales

- `E2E_BASE_URL` — apunta a otro dominio (por ejemplo staging). Default: `http://localhost:3000`.

## Tests incluidos

| Archivo | Qué prueba |
|---|---|
| `auth.spec.ts` | login/registro: validación, redirección, rate limit |
| `legal.spec.ts` | `/terms`, `/privacy`, `/cookies` cargan |
| `security-headers.spec.ts` | CSP, HSTS, X-Frame-Options, rate limit en register |

## Pendientes

- Login con cuenta real y crear hábito end-to-end (requiere DB de test o seed).
- Flujo de GDPR export + delete.
- Multi-usuario para probar IDOR (requiere 2 cuentas).
