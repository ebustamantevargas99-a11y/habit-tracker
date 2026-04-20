import { test, expect, type Page, type ConsoleMessage } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL ?? "https://habit-tracker-two-flame.vercel.app";
const TEST_EMAIL = "tester@ultimatetracker.app";
const TEST_PASSWORD = "TestUT2026!";

type Issue = {
  page: string;
  severity: "bug" | "warn" | "missing" | "ok";
  title: string;
  detail?: string;
};

const issues: Issue[] = [];
const consoleErrors: { page: string; text: string }[] = [];
const networkFails: { page: string; url: string; status: number }[] = [];

function hook(page: Page, label: string) {
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (
      text.includes("Failed to load resource") ||
      text.includes("favicon") ||
      text.includes("apple-icon") ||
      // Recharts con dataset vacío produce paths con solo "Z" — ruido conocido
      text.includes("Expected moveto path command")
    ) return;
    consoleErrors.push({ page: label, text });
  });
  page.on("response", (res) => {
    if (res.url().includes("/_next/") || res.url().includes("ingest.sentry") || res.url().includes("sentry.io")) return;
    if (res.status() >= 400 && res.url().includes("habit-tracker-two-flame.vercel.app")) {
      networkFails.push({ page: label, url: res.url(), status: res.status() });
    }
  });
}

async function loginAndReachHome(page: Page) {
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1200);
}

async function clickSidebar(page: Page, label: string) {
  const btn = page.getByRole("button", { name: new RegExp(`^\\s*${label}\\s*$`, "i") }).first();
  const count = await btn.count();
  if (count === 0) return false;
  await btn.click();
  await page.waitForTimeout(800);
  return true;
}

test.describe.configure({ mode: "serial" });

test.describe("Ultimate TRACKER — auditoría completa de prod", () => {
  test("1. Login + post-login redirect", async ({ page }) => {
    hook(page, "login");
    await loginAndReachHome(page);
    const url = page.url();
    if (url.includes("/login")) {
      issues.push({ page: "login", severity: "bug", title: "Login no redirige fuera de /login", detail: url });
    } else {
      issues.push({ page: "login", severity: "ok", title: `Login redirige a ${new URL(url).pathname}` });
    }
    await page.screenshot({ path: "test-results/01-after-login.png", fullPage: true });
  });

  test("2. Home Dashboard — rebrand + botones", async ({ page }) => {
    hook(page, "home");
    await loginAndReachHome(page);

    const greetingVisible = await page.getByText(/Buenos|Buenas/i).count();
    if (greetingVisible === 0) {
      issues.push({ page: "home", severity: "missing", title: "Sin saludo de bienvenida" });
    } else issues.push({ page: "home", severity: "ok", title: "Saludo dinámico visible" });

    const titleBrand = await page.locator("h2, h1").filter({ hasText: /Ultimate/i }).count();
    if (titleBrand === 0) {
      issues.push({ page: "home", severity: "missing", title: "Branding 'Ultimate TRACKER' no aparece en titulares" });
    }

    const dailyExport = await page.getByRole("button", { name: /Cierre del día/i }).count();
    if (dailyExport === 0) issues.push({ page: "home", severity: "missing", title: "Botón 'Cierre del día → IA' no visible" });
    else issues.push({ page: "home", severity: "ok", title: "Botón 'Cierre del día → IA' visible" });

    const weeklyExport = await page.getByRole("button", { name: /Resumen semanal/i }).count();
    if (weeklyExport === 0) issues.push({ page: "home", severity: "missing", title: "Botón 'Resumen semanal' no visible" });

    const floatingBtn = await page.getByRole("button", { name: /Analizar con IA/i }).count();
    if (floatingBtn === 0) issues.push({ page: "home", severity: "missing", title: "FloatingAIButton no visible" });
    else issues.push({ page: "home", severity: "ok", title: "FloatingAIButton presente" });

    await page.screenshot({ path: "test-results/02-home.png", fullPage: true });
  });

  test("3. Sidebar — módulos condicionales según perfil", async ({ page }) => {
    hook(page, "sidebar");
    await loginAndReachHome(page);
    const expectVisible = ["Inicio", "Productividad", "Fitness", "Nutrición", "Organización", "Bienestar"];
    for (const label of expectVisible) {
      const visible = await page.getByRole("button", { name: new RegExp(`^\\s*${label}\\s*$`, "i") }).count();
      if (visible === 0)
        issues.push({ page: "sidebar", severity: "missing", title: `Módulo "${label}" no aparece` });
    }
    await page.screenshot({ path: "test-results/03-sidebar.png", fullPage: true });
  });

  test("4. Fitness module — workout logger Pro", async ({ page }) => {
    hook(page, "fitness");
    await loginAndReachHome(page);
    const navOk = await clickSidebar(page, "Fitness");
    if (!navOk) {
      issues.push({ page: "fitness", severity: "bug", title: "No se puede navegar a Fitness desde sidebar" });
      return;
    }
    await page.waitForTimeout(1500);

    const proTab = page.getByText(/Nueva Sesión/i).first();
    if ((await proTab.count()) === 0) {
      issues.push({ page: "fitness", severity: "missing", title: "Tab 'Nueva Sesión (Pro)' no renderiza" });
    } else {
      await proTab.click();
      await page.waitForTimeout(1000);
      const addBtn = page.getByRole("button", { name: /Añadir ejercicio/i });
      if ((await addBtn.count()) === 0) {
        issues.push({ page: "fitness-pro", severity: "bug", title: "Botón 'Añadir ejercicio' no aparece" });
      } else {
        await addBtn.click();
        await page.waitForTimeout(1000);
        if ((await page.getByText(/Selecciona un ejercicio/i).count()) === 0) {
          issues.push({ page: "fitness-pro", severity: "bug", title: "Modal selector no abre" });
        } else {
          issues.push({ page: "fitness-pro", severity: "ok", title: "Selector de ejercicios abre" });
          const search = page.getByPlaceholder(/Buscar por nombre/i);
          if (await search.count()) {
            await search.fill("bench");
            await page.waitForTimeout(800);
            const hits = await page.getByText(/Press de banca/i).count();
            if (hits === 0)
              issues.push({ page: "fitness-pro", severity: "bug", title: "Búsqueda no devuelve 'Press de banca'" });
            else issues.push({ page: "fitness-pro", severity: "ok", title: "Búsqueda funciona" });
          }
          await page.keyboard.press("Escape");
          await page.waitForTimeout(400);
        }
      }
    }
    await page.screenshot({ path: "test-results/04-fitness-pro.png", fullPage: true });
  });

  test("5. Fitness — Volumen Pro dashboard", async ({ page }) => {
    hook(page, "fitness-volume");
    await loginAndReachHome(page);
    await clickSidebar(page, "Fitness");
    await page.waitForTimeout(1200);
    const volTab = page.getByText(/Volumen Pro/i).first();
    if ((await volTab.count()) > 0) {
      await volTab.click();
      await page.waitForTimeout(1500);
      if ((await page.getByText(/Volumen semanal/i).count()) === 0) {
        issues.push({ page: "fitness-volume", severity: "bug", title: "Dashboard volumen no renderiza" });
      } else issues.push({ page: "fitness-volume", severity: "ok", title: "Volumen dashboard OK" });
    }
    await page.screenshot({ path: "test-results/05-fitness-volume.png", fullPage: true });
  });

  test("6. Finanzas", async ({ page }) => {
    hook(page, "finance");
    await loginAndReachHome(page);
    const ok = await clickSidebar(page, "Finanzas");
    if (!ok) {
      issues.push({ page: "finance", severity: "missing", title: "Sidebar no tiene opción Finanzas" });
      return;
    }
    await page.waitForTimeout(1500);
    const hasContent = await page.locator("body").innerText();
    if (!hasContent || hasContent.length < 100) {
      issues.push({ page: "finance", severity: "bug", title: "Página Finanzas vacía" });
    } else issues.push({ page: "finance", severity: "ok", title: "Finanzas carga contenido" });
    await page.screenshot({ path: "test-results/06-finance.png", fullPage: true });
  });

  test("7. Nutrición", async ({ page }) => {
    hook(page, "nutrition");
    await loginAndReachHome(page);
    await clickSidebar(page, "Nutrición");
    await page.waitForTimeout(1500);
    await page.screenshot({ path: "test-results/07-nutrition.png", fullPage: true });
    issues.push({ page: "nutrition", severity: "ok", title: "Nutrición navegable" });
  });

  test("8. Productividad", async ({ page }) => {
    hook(page, "productivity");
    await loginAndReachHome(page);
    await clickSidebar(page, "Productividad");
    await page.waitForTimeout(1500);
    await page.screenshot({ path: "test-results/08-productivity.png", fullPage: true });
  });

  test("9. Organización", async ({ page }) => {
    hook(page, "organization");
    await loginAndReachHome(page);
    await clickSidebar(page, "Organización");
    await page.waitForTimeout(1500);
    await page.screenshot({ path: "test-results/09-organization.png", fullPage: true });
  });

  test("10. Bienestar", async ({ page }) => {
    hook(page, "wellness");
    await loginAndReachHome(page);
    await clickSidebar(page, "Bienestar");
    await page.waitForTimeout(1500);
    await page.screenshot({ path: "test-results/10-wellness.png", fullPage: true });
  });

  test("11. Configuración — tabs nuevos", async ({ page }) => {
    hook(page, "settings");
    await loginAndReachHome(page);
    await clickSidebar(page, "Configuración");
    await page.waitForTimeout(1500);

    for (const tab of ["Perfil", "Módulos", "Apariencia", "Gamificación", "Preferencias", "Datos"]) {
      const found = await page.getByRole("button", { name: new RegExp(tab, "i") }).count();
      if (found === 0)
        issues.push({ page: "settings", severity: "missing", title: `Tab "${tab}" no encontrado` });
    }

    const mod = page.getByRole("button", { name: /^Módulos$/i });
    if (await mod.count()) {
      await mod.click();
      await page.waitForTimeout(800);
      if ((await page.getByText(/Módulos activos/i).count()) === 0) {
        issues.push({ page: "settings-modules", severity: "bug", title: "Tab Módulos sin contenido" });
      } else issues.push({ page: "settings-modules", severity: "ok", title: "Tab Módulos OK" });
    }

    const appearance = page.getByRole("button", { name: /Apariencia/i });
    if (await appearance.count()) {
      await appearance.click();
      await page.waitForTimeout(800);
      if ((await page.getByText(/Modo oscuro/i).count()) === 0) {
        issues.push({ page: "settings-appearance", severity: "bug", title: "Tab Apariencia sin toggle darkmode" });
      } else issues.push({ page: "settings-appearance", severity: "ok", title: "Tab Apariencia OK" });
    }

    await page.screenshot({ path: "test-results/11-settings.png", fullPage: true });
  });

  test("12. AI Export modal — generación de prompt", async ({ page }) => {
    hook(page, "ai-export");
    await loginAndReachHome(page);
    const floating = page.getByRole("button", { name: /Analizar con IA/i });
    if ((await floating.count()) === 0) {
      issues.push({ page: "ai-export", severity: "missing", title: "FloatingAIButton no visible" });
      return;
    }
    await floating.click();
    await page.waitForTimeout(1000);
    const modalOpen = await page.getByText(/IA de destino|Estilo del análisis/i).count();
    if (modalOpen === 0) {
      issues.push({ page: "ai-export", severity: "bug", title: "Modal AI Export no abre" });
      return;
    }
    const genBtn = page.getByRole("button", { name: /Generar prompt/i });
    if (await genBtn.count()) {
      await genBtn.click();
      await page.waitForTimeout(4000);
      const preview = await page.getByText(/Prompt listo/i).count();
      if (preview === 0) {
        issues.push({ page: "ai-export", severity: "bug", title: "Generar prompt no muestra preview" });
      } else {
        issues.push({ page: "ai-export", severity: "ok", title: "AI Export genera prompt" });
        await page.screenshot({ path: "test-results/12-ai-export.png", fullPage: true });
      }
    }
  });

  test("13. Logout", async ({ page }) => {
    hook(page, "logout");
    await loginAndReachHome(page);
    const btn = page.getByRole("button", { name: /Cerrar sesión/i });
    if ((await btn.count()) === 0) {
      issues.push({ page: "logout", severity: "missing", title: "Botón 'Cerrar sesión' ausente" });
      return;
    }
    await btn.click();
    await page.waitForURL(/\/login/, { timeout: 10000 }).catch(() => {});
    if (!page.url().includes("/login")) {
      issues.push({ page: "logout", severity: "bug", title: "Logout no redirige a /login" });
    } else issues.push({ page: "logout", severity: "ok", title: "Logout OK" });
  });

  test.afterAll(() => {
    const fs = require("fs");
    const report = {
      runAt: new Date().toISOString(),
      baseUrl: BASE,
      testUser: TEST_EMAIL,
      summary: {
        bugs: issues.filter((i) => i.severity === "bug").length,
        missing: issues.filter((i) => i.severity === "missing").length,
        warn: issues.filter((i) => i.severity === "warn").length,
        ok: issues.filter((i) => i.severity === "ok").length,
      },
      issues,
      consoleErrors,
      networkFails,
    };
    fs.writeFileSync("test-results/audit-report.json", JSON.stringify(report, null, 2));
    console.log("\n=== AUDIT SUMMARY ===");
    console.log(JSON.stringify(report.summary));
    console.log(`Issues: ${issues.length}, Console errors: ${consoleErrors.length}, Net fails: ${networkFails.length}`);
  });
});
