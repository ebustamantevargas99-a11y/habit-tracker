import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  convertAmount,
  convertWithRates,
  isSingleCurrency,
  isSupportedCurrency,
  FX_RATES_PER_USD,
  getLiveRates,
  __resetLiveRatesCache,
} from "@/lib/finance/currency";

describe("convertAmount", () => {
  it("paridad cuando from === to", () => {
    expect(convertAmount(100, "USD", "USD")).toBe(100);
    expect(convertAmount(0, "PEN", "PEN")).toBe(0);
    expect(convertAmount(-50, "MXN", "MXN")).toBe(-50);
  });

  it("USD → PEN aplica tasa correcta", () => {
    // 1 USD = 3.78 PEN según FX_RATES_PER_USD
    expect(convertAmount(1, "USD", "PEN")).toBeCloseTo(3.78, 4);
    expect(convertAmount(100, "USD", "PEN")).toBeCloseTo(378, 2);
  });

  it("PEN → USD invierte la tasa", () => {
    // 3.78 PEN = 1 USD
    expect(convertAmount(3.78, "PEN", "USD")).toBeCloseTo(1, 4);
    expect(convertAmount(378, "PEN", "USD")).toBeCloseTo(100, 2);
  });

  it("USD → EUR usa rate de EUR per USD", () => {
    // 1 USD = 0.92 EUR
    expect(convertAmount(100, "USD", "EUR")).toBeCloseTo(92, 2);
  });

  it("PEN → MXN cruza correctamente via USD pivot", () => {
    // 1 PEN = (1/3.78) USD = 17.0/3.78 MXN ≈ 4.497 MXN
    const result = convertAmount(100, "PEN", "MXN");
    expect(result).toBeCloseTo((100 / 3.78) * 17.0, 2);
  });

  it("currency desconocida no rompe — devuelve amount sin tocar", () => {
    expect(convertAmount(100, "ZZZ", "USD")).toBe(100);
    expect(convertAmount(100, "USD", "ZZZ")).toBe(100);
    expect(convertAmount(100, "ZZZ", "ZZZ")).toBe(100);
  });

  it("from o to vacío devuelve amount", () => {
    expect(convertAmount(50, "", "USD")).toBe(50);
    expect(convertAmount(50, "USD", "")).toBe(50);
  });

  // Caso del bug que disparó este fix:
  // Activos = S/ 10,878 PEN + $2 USD + $2,282 USD + $100 USD
  // El cálculo viejo daba 13,262 (suma cruda); el correcto en PEN es
  // 10,878 + (2 + 2282 + 100) * 3.78 = 10,878 + 8,955.72 ≈ 19,833.72
  it("regresión: net worth con cuentas mixtas PEN + USD", () => {
    const balances = [
      { amount: 10878, currency: "PEN" },
      { amount: 2,     currency: "USD" },
      { amount: 2282,  currency: "USD" },
      { amount: 100,   currency: "USD" },
    ];
    const totalInPEN = balances.reduce(
      (s, b) => s + convertAmount(b.amount, b.currency, "PEN"),
      0,
    );
    // 2384 USD * 3.78 = 9,011.52 ; + 10,878 = 19,889.52
    expect(totalInPEN).toBeCloseTo(10878 + 2384 * 3.78, 2);
    // Más importante: no debe ser igual a la suma cruda (que era el bug).
    expect(totalInPEN).not.toBeCloseTo(13262, 0);
  });

  it("regresión: pasivos AMEX en USD no se restan como PEN", () => {
    // Antes: $1,016 AMEX se restaba como S/ 1,016 → bug.
    // Ahora: $1,016 → S/ 3,840.48
    const liabUSD = 1016;
    const inPEN = convertAmount(liabUSD, "USD", "PEN");
    expect(inPEN).toBeCloseTo(1016 * 3.78, 2);
    expect(inPEN).toBeGreaterThan(3000);
    expect(inPEN).not.toBe(1016);
  });
});

describe("isSingleCurrency", () => {
  it("vacío → true (no hay nada que mezclar)", () => {
    expect(isSingleCurrency([])).toBe(true);
  });
  it("una sola → true", () => {
    expect(isSingleCurrency(["USD"])).toBe(true);
    expect(isSingleCurrency(["USD", "USD", "USD"])).toBe(true);
  });
  it("mezcla → false", () => {
    expect(isSingleCurrency(["USD", "PEN"])).toBe(false);
    expect(isSingleCurrency(["MXN", "MXN", "USD"])).toBe(false);
  });
  it("ignora strings vacíos", () => {
    expect(isSingleCurrency(["USD", "", "USD"])).toBe(true);
  });
});

describe("isSupportedCurrency", () => {
  it("monedas conocidas", () => {
    expect(isSupportedCurrency("USD")).toBe(true);
    expect(isSupportedCurrency("PEN")).toBe(true);
    expect(isSupportedCurrency("MXN")).toBe(true);
  });
  it("desconocidas o vacío", () => {
    expect(isSupportedCurrency("ZZZ")).toBe(false);
    expect(isSupportedCurrency("")).toBe(false);
    expect(isSupportedCurrency(null)).toBe(false);
    expect(isSupportedCurrency(undefined)).toBe(false);
  });
});

describe("FX_RATES_PER_USD sanity", () => {
  it("USD siempre es 1", () => {
    expect(FX_RATES_PER_USD.USD).toBe(1);
  });
  it("todas las tasas son números positivos finitos", () => {
    for (const [code, rate] of Object.entries(FX_RATES_PER_USD)) {
      expect(rate, `rate for ${code}`).toBeGreaterThan(0);
      expect(Number.isFinite(rate), `rate for ${code} is finite`).toBe(true);
    }
  });
});

describe("convertWithRates", () => {
  it("usa la tabla de rates pasada explícitamente", () => {
    const customRates = { USD: 1, PEN: 4.0, EUR: 0.95 };
    expect(convertWithRates(100, "USD", "PEN", customRates)).toBe(400);
    expect(convertWithRates(100, "PEN", "USD", customRates)).toBe(25);
  });

  it("from === to devuelve amount", () => {
    expect(convertWithRates(50, "USD", "USD", FX_RATES_PER_USD)).toBe(50);
  });

  it("currency desconocida en la tabla → fallback amount", () => {
    expect(convertWithRates(100, "XYZ", "USD", FX_RATES_PER_USD)).toBe(100);
  });
});

describe("getLiveRates", () => {
  beforeEach(() => {
    __resetLiveRatesCache();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    __resetLiveRatesCache();
  });

  it("retorna source='live' cuando la API responde correctamente", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          result: "success",
          base_code: "USD",
          time_last_update_unix: 1714003200, // 2024-04-25 UTC
          rates: { USD: 1, EUR: 0.93, PEN: 3.79, MXN: 17.1 },
        }),
      }),
    );

    const result = await getLiveRates();
    expect(result.source).toBe("live");
    expect(result.rates.PEN).toBe(3.79);
    expect(result.rates.USD).toBe(1);
    expect(result.fetchedAt).toBe("2024-04-25");
  });

  it("cachea entre llamadas dentro del TTL (24h)", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: "success",
        time_last_update_unix: 1714003200,
        rates: { USD: 1, PEN: 3.8 },
      }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    await getLiveRates();
    await getLiveRates();
    await getLiveRates();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("fallback a estáticas si la API tira error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const result = await getLiveRates();
    expect(result.source).toBe("static");
    expect(result.rates).toBe(FX_RATES_PER_USD);
  });

  it("fallback a estáticas si la API responde con result: error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ result: "error", "error-type": "unsupported-code" }),
      }),
    );

    const result = await getLiveRates();
    expect(result.source).toBe("static");
  });

  it("fallback a estáticas si HTTP status no es 2xx", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );

    const result = await getLiveRates();
    expect(result.source).toBe("static");
  });
});
