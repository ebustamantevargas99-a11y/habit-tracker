import { describe, it, expect } from "vitest";
import { analyzeOmegaRatio } from "@/lib/nutrition/omega-ratio";

describe("analyzeOmegaRatio", () => {
  it("clasifica excellent para ratio ≤4:1", () => {
    const r = analyzeOmegaRatio(2, 4);
    expect(r.ratio).toBe(2);
    expect(r.classification).toBe("excellent");
  });
  it("clasifica good para 4-8:1", () => {
    expect(analyzeOmegaRatio(1, 5).classification).toBe("good");
    expect(analyzeOmegaRatio(1, 8).classification).toBe("good");
  });
  it("clasifica poor para 8-15:1", () => {
    expect(analyzeOmegaRatio(1, 10).classification).toBe("poor");
    expect(analyzeOmegaRatio(1, 15).classification).toBe("poor");
  });
  it("clasifica very_poor para >15:1", () => {
    expect(analyzeOmegaRatio(1, 20).classification).toBe("very_poor");
    expect(analyzeOmegaRatio(0.5, 12).classification).toBe("very_poor");
  });
  it("detecta no_omega3 cuando solo hay omega-6", () => {
    const r = analyzeOmegaRatio(0, 5);
    expect(r.classification).toBe("no_omega3");
    expect(r.ratio).toBeNull();
  });
  it("detecta no_data cuando ambos son null/0", () => {
    expect(analyzeOmegaRatio(0, 0).classification).toBe("no_data");
    expect(analyzeOmegaRatio(null, null).classification).toBe("no_data");
    expect(analyzeOmegaRatio(undefined, undefined).classification).toBe("no_data");
  });
  it("redondea ratio a 1 decimal", () => {
    expect(analyzeOmegaRatio(3, 10).ratio).toBe(3.3);
  });
});
