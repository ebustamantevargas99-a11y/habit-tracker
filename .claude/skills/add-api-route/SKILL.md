---
name: add-api-route
description: Crea una API route de Next.js 14 siguiendo las convenciones del proyecto — withAuth + Zod + ownership check. Úsalo cuando el usuario pida "añade un endpoint", "nueva API route", o esté scaffolding un CRUD.
---

# Add API Route

## Cuándo usar

Cuando se necesite crear una nueva ruta bajo `src/app/api/**/route.ts` que opere sobre datos del usuario.

## Patrón para POST (create)

```ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { parseJson, <tuSchemaCreate> } from "@/lib/validation";

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = await parseJson(req, <tuSchemaCreate>);
    if (!parsed.ok) return parsed.response;

    const record = await prisma.<modelo>.create({
      data: { userId, ...parsed.data },
    });
    return NextResponse.json(record, { status: 201 });
  });
}
```

## Patrón para GET (list con paginación)

```ts
export async function GET(req: NextRequest) {
  return withAuth(async (userId) => {
    const { searchParams } = new URL(req.url);
    const take = Math.min(parseInt(searchParams.get("limit") ?? "100", 10) || 100, 500);
    const skip = Math.max(parseInt(searchParams.get("skip") ?? "0", 10) || 0, 0);

    const records = await prisma.<modelo>.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    });
    return NextResponse.json(records);
  });
}
```

## Patrón para PATCH/DELETE con ownership

```ts
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(async (userId) => {
    const existing = await prisma.<modelo>.findFirst({
      where: { id: params.id, userId },
    });
    if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const parsed = await parseJson(req, <tuSchemaUpdate>);
    if (!parsed.ok) return parsed.response;

    const updated = await prisma.<modelo>.update({
      where: { id: params.id },
      data: parsed.data,
    });
    return NextResponse.json(updated);
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(async (userId) => {
    const existing = await prisma.<modelo>.findFirst({
      where: { id: params.id, userId },
    });
    if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    await prisma.<modelo>.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  });
}
```

## Antes de terminar

- Añadir schemas Zod en `src/lib/validation/schemas/<dominio>.ts` y exportarlos en `src/lib/validation/index.ts`.
- Verificar que el modelo Prisma tenga `userId` + relación a `User`.
- Si el endpoint devuelve datos de User, `select` explícito sin `passwordHash`.
