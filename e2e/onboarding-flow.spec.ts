import { test, expect } from "@playwright/test";
import { BASE, track, bug, ok, missing } from "./helpers";

const NEW_EMAIL = `onboarding-${Date.now()}@test.ultimatetracker.app`;
const NEW_PASSWORD = "NewUser2026!";

test.describe.configure({ mode: "serial" });

test.describe("Onboarding desde cero — registro nuevo + wizard 5 pasos", () => {
  test("registro crea cuenta y redirige a /onboarding", async ({ page }) => {
    track(page, "onboarding-register");
    await page.goto(`${BASE}/login`);

    const registerTab = page.getByRole("button", { name: /Registrarse/i });
    if ((await registerTab.count()) === 0) {
      bug("onboarding", "No hay tab 'Registrarse' en /login");
      return;
    }
    await registerTab.click();
    await page.waitForTimeout(500);

    await page.fill('input[type="text"]', "Usuario Onboarding");
    await page.fill('input[type="email"]', NEW_EMAIL);
    await page.fill('input[type="password"]', NEW_PASSWORD);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/onboarding|\/$/, { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2000);

    if (page.url().includes("/login")) {
      const errMsg = await page.textContent("body").catch(() => "");
      bug("onboarding", "Registro no redirige — falla el submit o validación", errMsg?.slice(0, 200));
      return;
    }

    if (!page.url().includes("/onboarding")) {
      bug("onboarding", `Tras registro debería ir a /onboarding, fue a ${page.url()}`);
    } else {
      ok("onboarding", "Registro redirige a /onboarding");
    }
    await page.screenshot({ path: "test-results/onb-01-after-register.png" });
  });

  test("wizard paso 1 — bienvenida + nombre", async ({ page }) => {
    track(page, "onboarding-step1");
    await page.goto(`${BASE}/login`);
    await page.getByRole("button", { name: /Iniciar sesi/i }).click().catch(() => {});
    await page.fill('input[type="email"]', NEW_EMAIL);
    await page.fill('input[type="password"]', NEW_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/onboarding|\/$/, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    if (!page.url().includes("/onboarding")) {
      bug("onboarding", "Login después de registro no lleva a /onboarding");
      return;
    }

    const heading = await page.getByRole("heading").first().textContent();
    if (!heading?.includes("Bienvenid")) {
      missing("onboarding-step1", `Heading no es 'Bienvenido'. Fue: ${heading}`);
    } else ok("onboarding-step1", "Heading correcto");

    const nameInput = page.getByPlaceholder(/Tu nombre/i);
    if ((await nameInput.count()) === 0) {
      bug("onboarding-step1", "Input de nombre no encontrado");
      return;
    }
    await nameInput.fill("Tester Completo");
    const continueBtn = page.getByRole("button", { name: /Continuar/i });
    await continueBtn.click();
    await page.waitForTimeout(800);
    ok("onboarding-step1", "Paso 1 completado");
    await page.screenshot({ path: "test-results/onb-02-step1.png" });
  });

  test("wizard paso 2 — datos básicos", async ({ page }) => {
    track(page, "onboarding-step2");
    await page.goto(`${BASE}/onboarding`);
    await page.waitForTimeout(1500);

    const dateInput = page.locator('input[type="date"]');
    if ((await dateInput.count()) === 0) {
      bug("onboarding-step2", "Input de fecha no encontrado — quizás paso 1 no persistió");
      return;
    }
    await dateInput.fill("1995-06-15");

    const maleBtn = page.getByRole("button", { name: /^Masculino$/i });
    if ((await maleBtn.count()) === 0) {
      bug("onboarding-step2", "Botón 'Masculino' no encontrado");
    } else {
      await maleBtn.click();
      ok("onboarding-step2", "Selección de sexo biológico funciona");
    }

    await page.getByRole("button", { name: /Continuar/i }).click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: "test-results/onb-03-step2.png" });
  });

  test("wizard paso 3 — cuerpo y actividad", async ({ page }) => {
    track(page, "onboarding-step3");

    const heightInput = page.locator('input[type="number"]').first();
    if ((await heightInput.count()) > 0) {
      await heightInput.fill("175");
    }
    const weightInput = page.locator('input[type="number"]').nth(1);
    if ((await weightInput.count()) > 0) {
      await weightInput.fill("72");
    }
    const moderateBtn = page.getByRole("button", { name: /Moderado/i }).first();
    if ((await moderateBtn.count()) > 0) {
      await moderateBtn.click();
      await page.waitForTimeout(300);
    }
    const continueBtn = page.getByRole("button", { name: /Continuar/i });
    if ((await continueBtn.count()) === 0) {
      missing("onboarding-step3", "Botón Continuar no encontrado en paso 3");
      return;
    }
    await continueBtn.click({ timeout: 5000 }).catch(() => {
      missing("onboarding-step3", "Click en Continuar no avanzó");
    });
    await page.waitForTimeout(800);
    ok("onboarding-step3", "Paso 3 OK");
    await page.screenshot({ path: "test-results/onb-04-step3.png" });
  });

  test("wizard paso 4 — intereses", async ({ page }) => {
    track(page, "onboarding-step4");
    // Toggle algunos intereses
    const interests = [/Entrenamiento/i, /Nutrición/i, /Mindfulness/i, /Sueño/i];
    for (const re of interests) {
      const btn = page.getByText(re).first();
      if ((await btn.count()) > 0) {
        await btn.click();
        await page.waitForTimeout(200);
      } else {
        missing("onboarding-step4", `Interés ${re.source} no encontrado`);
      }
    }
    await page.getByRole("button", { name: /Continuar/i }).click();
    await page.waitForTimeout(800);
    ok("onboarding-step4", "Paso 4 OK");
    await page.screenshot({ path: "test-results/onb-05-step4.png" });
  });

  test("wizard paso 5 — review + empezar", async ({ page }) => {
    track(page, "onboarding-step5");
    const reviewText = await page.textContent("main").catch(() => "");
    if (!reviewText?.includes("Tester Completo")) {
      missing("onboarding-step5", "Nombre guardado no aparece en review");
    }
    const startBtn = page.getByRole("button", { name: /Empezar mi tracking/i });
    if ((await startBtn.count()) === 0) {
      bug("onboarding-step5", "Botón 'Empezar mi tracking' no encontrado");
      return;
    }
    await startBtn.click();
    await page.waitForURL((u) => !u.toString().includes("/onboarding"), { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    if (page.url().includes("/onboarding")) {
      bug("onboarding-step5", "Submit onboarding no redirige al Home");
    } else ok("onboarding-step5", "Onboarding completado → redirige a Home");
    await page.screenshot({ path: "test-results/onb-06-done.png", fullPage: true });
  });
});
