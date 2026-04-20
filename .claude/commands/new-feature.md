---
description: Scaffolding completo para una feature nueva — schema Prisma, API routes CRUD con Zod + withAuth, store Zustand, y placeholder de UI
argument-hint: <nombre-feature> (ej: journaling)
---

# /new-feature $1

Crea una feature nueva siguiendo las convenciones del proyecto.

## Pasos

1. **Validar el nombre** `$1`: camelCase o kebab-case. Ej: `journaling`, `goal-tracking`.

2. **Plan breve** antes de generar archivos:
   - Tabla Prisma propuesta
   - Endpoints REST (GET list, POST create, GET [id], PATCH [id], DELETE [id])
   - Schema Zod
   - Store Zustand

3. **Generar archivos**:
   - `prisma/schema.prisma` → añadir modelo con `userId String` + relación `user User @relation(...)`, `createdAt`, `updatedAt`.
   - `src/lib/validation/schemas/$1.ts` → schemas `create`, `update`.
   - `src/app/api/$1/route.ts` → GET (list) + POST (create), con `withAuth` y Zod.
   - `src/app/api/$1/[id]/route.ts` → PATCH + DELETE con ownership check (`findFirst { id, userId }` antes de mutar).
   - `src/stores/$1-store.ts` → Zustand store con `fetch`, `create`, `update`, `delete`.
   - `src/components/features/$1/$1-page.tsx` → placeholder con layout estándar.

4. **Correr migración**:
   - `npx prisma migrate dev --name add_$1 --create-only`
   - Mostrar el SQL generado.
   - Pedir confirmación antes de aplicar.

5. **Añadir a sidebar** (`src/components/layout/sidebar.tsx`) y al enum de rutas si existe.

6. **Verificación**:
   - `npm run build` debe pasar.
   - Recordar al usuario que falta UI real + tests.

## Convenciones obligatorias (NO saltar)

- Todos los endpoints protegidos con `withAuth`.
- Todo body validado con `parseJson(req, schema)`.
- Todo `update`/`delete` precedido por `findFirst({ where: { id, userId } })`.
- Sin `any`.
- Sin `console.log` en el código de producción.
