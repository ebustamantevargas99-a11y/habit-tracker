import { test, expect } from "@playwright/test";

test.describe("Security headers", () => {
  test("headers de seguridad presentes en responses", async ({ request }) => {
    const res = await request.get("/login");
    const headers = res.headers();

    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["strict-transport-security"]).toContain("max-age=");
    expect(headers["content-security-policy"]).toBeTruthy();
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["x-powered-by"]).toBeUndefined();
  });

  test("rate limit en /api/auth/register tras 5 intentos rápidos", async ({
    request,
  }) => {
    let rateLimited = false;
    for (let i = 0; i < 10; i++) {
      const res = await request.post("/api/auth/register", {
        data: { email: `bad-${i}@x`, password: "weakpass" },
      });
      if (res.status() === 429) {
        rateLimited = true;
        break;
      }
    }
    expect(rateLimited).toBe(true);
  });
});
