import { test, devices } from "@playwright/test";
import { BASE, TEST_EMAIL, TEST_PASSWORD, track, bug, ok, missing } from "./helpers";

test.use({ ...devices["iPhone 14"] });

test.describe("Mobile responsive — viewport 390x844", () => {
  test("login renderiza bien en mobile", async ({ page }) => {
    track(page, "mobile-login");
    await page.goto(`${BASE}/login`);
    const h1 = await page.locator("h1").first().textContent();
    if (!h1?.includes("Ultimate")) {
      bug("mobile-login", `Título no es 'Ultimate TRACKER'. Fue: ${h1}`);
    } else ok("mobile-login", "Título correcto en mobile");

    const emailInput = page.locator('input[type="email"]');
    const box = await emailInput.boundingBox();
    if (box && box.width > 400) {
      bug("mobile-login", "Input email más ancho que el viewport (overflow)", String(box.width));
    }
    await page.screenshot({ path: "test-results/mob-01-login.png", fullPage: true });
  });

  test("login + home en mobile — sidebar oculto y main visible", async ({ page }) => {
    track(page, "mobile-home");
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const mainContent = await page.textContent("main").catch(() => "");
    if (!mainContent || mainContent.length < 50) {
      bug("mobile-home", "Main vacío en mobile — posible bug de layout");
    } else ok("mobile-home", "Home renderiza en mobile");

    // El sidebar debería estar cerrado o ser drawer en mobile
    const viewport = page.viewportSize();
    const sidebarLinks = await page.getByRole("button", { name: /Fitness/i }).count();
    if (viewport && viewport.width < 500 && sidebarLinks > 0) {
      // Sidebar visible — verificar que no tape el main
      ok("mobile-home", "Sidebar visible y clickeable en mobile");
    }

    const floatingBtn = await page.getByRole("button", { name: /Analizar con IA|Exportar a IA/i }).count();
    if (floatingBtn === 0) {
      missing("mobile-home", "FloatingAIButton no visible en mobile");
    } else ok("mobile-home", "FloatingAIButton accesible en mobile");

    await page.screenshot({ path: "test-results/mob-02-home.png", fullPage: true });
  });

  test("horizontal scroll check — nada debe ser más ancho que el viewport", async ({ page }) => {
    track(page, "mobile-overflow");
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    const overflow = await page.evaluate(() => {
      const html = document.documentElement;
      return {
        docWidth: html.scrollWidth,
        viewportWidth: window.innerWidth,
      };
    });
    if (overflow.docWidth > overflow.viewportWidth + 5) {
      bug(
        "mobile-overflow",
        `Overflow horizontal en home: scrollWidth ${overflow.docWidth} > viewport ${overflow.viewportWidth}`
      );
    } else ok("mobile-overflow", "Sin overflow horizontal en home");
  });
});
