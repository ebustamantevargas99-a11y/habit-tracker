import { test } from "@playwright/test";
import { BASE, login, track, clickSidebar, bug, ok, missing } from "./helpers";

test.describe.configure({ mode: "serial" });

test.describe("Dark mode — toggle y verificación visual", () => {
  test("activar dark mode desde Settings → Apariencia", async ({ page }) => {
    track(page, "darkmode-toggle");
    await login(page);

    await clickSidebar(page, "Configuración");
    await page.waitForTimeout(1500);

    const apearanceTab = page.getByRole("button", { name: /Apariencia/i });
    if ((await apearanceTab.count()) === 0) {
      bug("darkmode", "Tab 'Apariencia' no encontrado");
      return;
    }
    await apearanceTab.click();
    await page.waitForTimeout(800);

    // Screenshot BEFORE dark mode
    await page.screenshot({ path: "test-results/dm-01-light.png", fullPage: true });

    // Encontrar el toggle de dark mode
    const toggleArea = page.getByText(/Modo oscuro/i).first();
    if ((await toggleArea.count()) === 0) {
      bug("darkmode", "Label 'Modo oscuro' no encontrado");
      return;
    }

    // El toggle es un botón cerca del label. Buscar el más cercano.
    const toggleBtn = page.locator('button').filter({ hasText: /^$/ })
      .locator("xpath=ancestor::*[contains(., 'Modo oscuro')][1]//button").first();

    const allButtons = await page.getByRole("button").all();
    let foundToggle = false;
    for (const btn of allButtons) {
      const className = await btn.getAttribute("class");
      if (className && className.includes("rounded-full") && className.includes("w-12")) {
        await btn.click();
        foundToggle = true;
        break;
      }
    }

    if (!foundToggle) {
      missing("darkmode", "Toggle switch del dark mode no encontrable por className");
      return;
    }

    await page.waitForTimeout(1500);

    // Verificar que html tiene class="dark"
    const htmlClasses = await page.evaluate(() => document.documentElement.className);
    if (!htmlClasses.includes("dark")) {
      bug("darkmode", `Class 'dark' no se aplicó al html. Classes: ${htmlClasses}`);
    } else ok("darkmode", "Dark mode se aplica al <html>");

    // Screenshot AFTER
    await page.screenshot({ path: "test-results/dm-02-dark.png", fullPage: true });

    // Verificar color de background cambió
    const bgColor = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
    if (bgColor.includes("255") || bgColor === "rgba(0, 0, 0, 0)") {
      bug("darkmode", `Background en dark mode aún parece claro: ${bgColor}`);
    } else ok("darkmode", `Background cambió a oscuro: ${bgColor}`);
  });

  test("navegar con dark mode activo — Home renderiza bien", async ({ page }) => {
    track(page, "darkmode-navigate");
    await login(page);
    // Asumir que dark mode ya está activado de la prueba anterior
    await page.waitForTimeout(1500);

    const htmlClasses = await page.evaluate(() => document.documentElement.className);
    if (!htmlClasses.includes("dark")) {
      // Activarlo otra vez
      await clickSidebar(page, "Configuración");
      await page.waitForTimeout(1000);
      const app = page.getByRole("button", { name: /Apariencia/i });
      if (await app.count()) {
        await app.click();
        await page.waitForTimeout(600);
        const allButtons = await page.getByRole("button").all();
        for (const btn of allButtons) {
          const cn = await btn.getAttribute("class");
          if (cn && cn.includes("rounded-full") && cn.includes("w-12")) {
            await btn.click();
            break;
          }
        }
      }
      await page.waitForTimeout(1500);
    }

    // Ir al Home
    await clickSidebar(page, "Inicio");
    await page.waitForTimeout(1500);
    await page.screenshot({ path: "test-results/dm-03-home-dark.png", fullPage: true });

    const mainText = await page.textContent("main").catch(() => "");
    if (!mainText || mainText.length < 50) {
      bug("darkmode-home", "Home vacío en dark mode");
    } else ok("darkmode-home", "Home renderiza con dark mode");
  });
});
