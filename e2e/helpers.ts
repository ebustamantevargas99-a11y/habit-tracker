import type { Page, ConsoleMessage } from "@playwright/test";

export const BASE =
  process.env.E2E_BASE_URL ?? "https://habit-tracker-two-flame.vercel.app";

export const TEST_EMAIL = "tester@ultimatetracker.app";
export const TEST_PASSWORD = "TestUT2026!";

export type Issue = {
  module: string;
  severity: "bug" | "warn" | "missing" | "ok";
  title: string;
  detail?: string;
};

export const issues: Issue[] = [];
export const consoleErrors: { module: string; text: string }[] = [];
export const networkFails: { module: string; url: string; status: number }[] = [];

export function track(page: Page, label: string) {
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() !== "error") return;
    const t = msg.text();
    if (
      t.includes("Failed to load resource") ||
      t.includes("favicon") ||
      t.includes("apple-icon") ||
      t.includes("Expected moveto path command") ||
      t.includes("net::ERR_BLOCKED_BY_CLIENT")
    )
      return;
    consoleErrors.push({ module: label, text: t });
  });
  page.on("response", (res) => {
    const u = res.url();
    if (
      u.includes("/_next/") ||
      u.includes("ingest.sentry") ||
      u.includes("sentry.io") ||
      u.includes("vercel-insights")
    )
      return;
    if (res.status() >= 400 && u.includes("habit-tracker-two-flame.vercel.app")) {
      networkFails.push({ module: label, url: u, status: res.status() });
    }
  });
}

export async function login(page: Page) {
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 15000 });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1500);
}

export async function clickSidebar(page: Page, label: string) {
  const btn = page.getByRole("button", { name: new RegExp(`^\\s*${label}\\s*$`, "i") }).first();
  if ((await btn.count()) === 0) return false;
  await btn.click();
  await page.waitForTimeout(1200);
  return true;
}

export async function clickTab(page: Page, text: string | RegExp) {
  const tab = page.getByText(text).first();
  if ((await tab.count()) === 0) return false;
  await tab.click();
  await page.waitForTimeout(900);
  return true;
}

export function ok(module: string, title: string) {
  issues.push({ module, severity: "ok", title });
}
export function bug(module: string, title: string, detail?: string) {
  issues.push({ module, severity: "bug", title, detail });
}
export function missing(module: string, title: string) {
  issues.push({ module, severity: "missing", title });
}
export function warn(module: string, title: string) {
  issues.push({ module, severity: "warn", title });
}

export function writeFinalReport() {
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
  fs.mkdirSync("test-results", { recursive: true });
  fs.writeFileSync("test-results/audit-report.json", JSON.stringify(report, null, 2));
  return report;
}
