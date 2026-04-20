import { test, expect } from "@playwright/test";

test.describe("Páginas legales (públicas)", () => {
  test("/terms carga y muestra contenido", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /Términos/i
    );
  });

  test("/privacy carga y muestra contenido", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /Privacidad/i
    );
  });

  test("/cookies carga y muestra contenido", async ({ page }) => {
    await page.goto("/cookies");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /Cookies/i
    );
  });
});
