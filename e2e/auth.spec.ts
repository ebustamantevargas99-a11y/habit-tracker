import { test, expect } from "@playwright/test";

test.describe("Autenticación", () => {
  test("la página de login carga correctamente", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("rutas protegidas sin sesión redirigen a /login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("registro con password débil retorna error de validación", async ({
    request,
  }) => {
    const res = await request.post("/api/auth/register", {
      data: {
        email: `test-${Date.now()}@example.com`,
        password: "short",
      },
    });
    expect(res.status()).toBe(400);
  });

  test("registro con email inválido retorna 400", async ({ request }) => {
    const res = await request.post("/api/auth/register", {
      data: {
        email: "not-an-email",
        password: "StrongPass123",
      },
    });
    expect(res.status()).toBe(400);
  });
});
