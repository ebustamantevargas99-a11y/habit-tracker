# Reglas de seguridad — no negociables

> Contrato de seguridad del Ultimate Tracker. Importado desde `CLAUDE.md` y
> referenciado por el comando `/security-scan` y el agente `security-reviewer`.
> Es un SaaS con datos personales rumbo a beta pública: estas reglas no se saltan.

## Las 8 reglas duras

1. **Toda ruta protegida usa `withAuth()`** de `src/lib/api-helpers.ts`. Nunca llames a `prisma` sin pasar por `withAuth` o `auth()`.
2. **Todo query Prisma que opera sobre recursos del usuario debe filtrar por `userId`** además del `id` del recurso. Patrón: `findFirst({ where: { id, userId } })` → `update/delete({ where: { id } })`. Nunca saltes el check de ownership.
3. **Todo endpoint que recibe body usa Zod** con `parseJson(req, schema)`. Nunca `await req.json()` directo.
4. **Passwords hasheadas con bcrypt, rondas ≥ 13.** Nunca MD5, SHA1, plain.
5. **Nunca expongas el campo `password`/`passwordHash`** en `select` de Prisma hacia el cliente.
6. **Nunca uses `$queryRawUnsafe`** ni concatenación en `$queryRaw`. Siempre parametrizado.
7. **Nunca pongas secretos en `NEXT_PUBLIC_*`.** Esas vars van al bundle cliente.
8. **Nunca commitees `.env*`** (está en `.gitignore`; además el hook `block-sensitive-writes` bloquea cualquier escritura a `.env*` y a llaves privadas).

## Enforcement automático (no depende del criterio del modelo)

- **Permisos** (`.claude/settings.json` → `deny`): `Read(./.env*)`, `git push --force`, `git reset --hard`, `git commit --no-verify`, `rm -rf`, `npm audit fix --force`.
- **Hook `PreToolUse`** (`.claude/hooks/block-sensitive-writes.cjs`): bloquea `Write`/`Edit`/`MultiEdit`/`NotebookEdit` sobre `.env*`, `*.pem`, `*.key`, `*.p12`, `*.pfx`, `id_rsa`/`id_ed25519`/`id_ecdsa` y `.netrc`. Permite `*.example`. Exit `2` = bloqueado.
- **Pre-commit** (husky + lint-staged): `prettier --write` + `eslint --fix` sobre lo staged.

## Patrón de referencia — ownership check

Toda mutación sobre un recurso del usuario valida pertenencia **antes** de escribir:

```ts
const existing = await prisma.miModelo.findFirst({
  where: { id: params.id, userId }, // ownership: id + userId juntos
});
if (!existing) {
  return NextResponse.json({ error: "No encontrado" }, { status: 404 });
}
// recién aquí: update / delete por id
```

Los patrones completos de API route (POST con `withAuth`, PATCH con ownership)
viven en la sección `## Patrones` de [`CLAUDE.md`](../../CLAUDE.md).

## Antes de commitear cambios sensibles

Ejecuta `/security-scan` (o una revisión equivalente con el agente
`security-reviewer`) cuando toques: auth, rutas API, queries Prisma, manejo de
secretos o validación de input.
