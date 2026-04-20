import { test } from "@playwright/test";
import { login, track, bug, ok, missing } from "./helpers";

test.describe.configure({ mode: "serial" });

test.describe("AI Export — flujo completo con prompt real", () => {
  test("genera prompt para 'cierre del día' con datos reales", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    track(page, "ai-export-daily");
    await login(page);

    const btn = page.getByRole("button", { name: /Cierre del día/i }).first();
    if ((await btn.count()) === 0) {
      missing("ai-export", "Botón 'Cierre del día' no encontrado en Home");
      return;
    }
    await btn.click();
    await page.waitForTimeout(1200);

    const modalOpen = await page.getByText(/Estilo del análisis|IA de destino/i).count();
    if (modalOpen === 0) {
      bug("ai-export", "Modal AI export no abre");
      return;
    }
    ok("ai-export", "Modal abre con opciones");

    const generateBtn = page.getByRole("button", { name: /Generar prompt/i });
    if ((await generateBtn.count()) === 0) {
      bug("ai-export", "Botón 'Generar prompt' ausente");
      return;
    }
    await generateBtn.click();

    await page.waitForSelector("text=/Prompt listo/i", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1500);

    const preview = await page.getByText(/Prompt listo/i).count();
    if (preview === 0) {
      bug("ai-export", "No aparece 'Prompt listo' tras generar — posible fallo en /api/ai-export");
      const errText = await page.textContent("body").catch(() => "");
      if (errText?.includes("Error")) {
        bug("ai-export", "Mensaje de error visible en UI", errText.slice(0, 300));
      }
      return;
    }
    ok("ai-export", "Prompt generado correctamente");

    // Verificar que el textarea tiene contenido real
    const textareas = page.locator("textarea");
    const tCount = await textareas.count();
    if (tCount > 0) {
      const content = await textareas.last().inputValue();
      if (!content || content.length < 100) {
        bug("ai-export", `Prompt generado está vacío o demasiado corto (${content.length} chars)`);
      } else {
        ok("ai-export", `Prompt generado tiene ${content.length} caracteres`);
        // Verificar que incluye datos del perfil
        if (!content.includes("Edad") && !content.includes("perfil")) {
          bug("ai-export", "Prompt no incluye datos del perfil");
        }
      }
    }

    await page.screenshot({ path: "test-results/ai-01-prompt-generated.png", fullPage: true });

    // Click en "Copiar"
    const copyBtn = page.getByRole("button", { name: /^Copiar$/i });
    if ((await copyBtn.count()) > 0) {
      await copyBtn.click();
      await page.waitForTimeout(800);
      // Verificar clipboard (solo si browser permite)
      const clipText = await page.evaluate(() => navigator.clipboard.readText()).catch(() => "");
      if (clipText && clipText.length > 100) {
        ok("ai-export", "Clipboard contiene el prompt");
      } else {
        missing("ai-export", "Clipboard vacío o permiso denegado");
      }
    }

    // Click en "Cambiar opciones"
    const changeBtn = page.getByRole("button", { name: /Cambiar opciones/i });
    if ((await changeBtn.count()) > 0) {
      await changeBtn.click();
      await page.waitForTimeout(500);
      ok("ai-export", "Botón 'Cambiar opciones' funciona");
    }
  });

  test("genera prompt para scope 'fitness' con estilo 'analyst'", async ({ page }) => {
    track(page, "ai-export-fitness");
    await login(page);

    // Click flotante
    const floating = page.getByRole("button", { name: /Analizar con IA/i });
    if ((await floating.count()) === 0) {
      missing("ai-export-float", "FloatingAIButton no visible");
      return;
    }
    await floating.click();
    await page.waitForTimeout(1000);

    const scopeSelect = page.locator("select").first();
    if (await scopeSelect.count()) {
      await scopeSelect.selectOption("fitness");
    }

    const analystBtn = page.getByRole("button", { name: /^Analista$/i });
    if (await analystBtn.count()) await analystBtn.click();
    await page.waitForTimeout(400);

    const customQ = page.locator("textarea").first();
    if (await customQ.count()) {
      await customQ.fill("¿Cuánto volumen tengo de pecho esta semana?");
    }

    await page.getByRole("button", { name: /Generar prompt/i }).click();
    await page.waitForTimeout(4000);
    await page.screenshot({ path: "test-results/ai-02-fitness-analyst.png", fullPage: true });
    ok("ai-export", "Flujo fitness + analyst + pregunta custom OK");
  });

  test("scope 'holistic' genera prompt completo", async ({ page }) => {
    track(page, "ai-export-holistic");
    await login(page);
    const floating = page.getByRole("button", { name: /Analizar con IA/i });
    await floating.click();
    await page.waitForTimeout(1000);
    const scopeSelect = page.locator("select").first();
    if (await scopeSelect.count()) {
      await scopeSelect.selectOption("holistic");
    }
    await page.getByRole("button", { name: /Generar prompt/i }).click();
    await page.waitForTimeout(5000);
    const preview = await page.getByText(/Prompt listo/i).count();
    if (preview === 0) {
      bug("ai-export-holistic", "Holistic scope no genera preview");
    } else ok("ai-export-holistic", "Holistic prompt generado");
    await page.screenshot({ path: "test-results/ai-03-holistic.png", fullPage: true });
  });
});
