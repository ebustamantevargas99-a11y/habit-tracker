import { describe, it, expect } from "vitest";
import {
  tanakaMaxHr,
  karvonenZones,
  classifyHrZone,
  paceSecPerKm,
  speedKmH,
  riegelPredict,
  predictClassicRaces,
  estimateVo2MaxFromRace,
  classifyVo2Max,
  detectNegativeSplit,
  fatigueDrift,
  shoeHealth,
  CLASSIC_RACES,
  type SplitRow,
} from "@/lib/fitness/cardio";

describe("Tanaka HR_max", () => {
  it("edad 30 → ~187 bpm", () => {
    expect(tanakaMaxHr(30)).toBe(187);
  });
  it("edad 20 → ~194", () => {
    expect(tanakaMaxHr(20)).toBe(194);
  });
  it("edad 60 → ~166", () => {
    expect(tanakaMaxHr(60)).toBe(166);
  });
  it("edad rara (<10) usa fallback 220-edad", () => {
    expect(tanakaMaxHr(5)).toBe(215);
  });
});

describe("Karvonen zones", () => {
  it("5 zonas ordenadas ascendentes", () => {
    const z = karvonenZones(30, 60);
    expect(z).toHaveLength(5);
    for (let i = 1; i < 5; i++) {
      expect(z[i].minBpm).toBeGreaterThanOrEqual(z[i - 1].maxBpm - 1);
    }
  });

  it("Z5 max = HR_max estimada (Tanaka)", () => {
    const z = karvonenZones(30, 60);
    expect(z[4].maxBpm).toBe(tanakaMaxHr(30));
  });

  it("Z1 min ≥ restingHr + 10%HRR", () => {
    const rest = 60;
    const z = karvonenZones(30, rest);
    expect(z[0].minBpm).toBeGreaterThan(rest);
  });

  it("acepta maxHr override (p.ej. test de lab)", () => {
    const z = karvonenZones(30, 60, { maxHr: 200 });
    expect(z[4].maxBpm).toBe(200);
  });

  it("rechaza restingHr absurdo", () => {
    expect(() => karvonenZones(30, 5)).toThrow();
    expect(() => karvonenZones(30, 200)).toThrow();
  });
});

describe("classifyHrZone", () => {
  const zones = karvonenZones(30, 60);
  it("145 bpm con HR 60 y edad 30 debería caer en alguna zona", () => {
    const z = classifyHrZone(145, zones);
    expect(z).not.toBeNull();
    expect(z!.zone).toBeGreaterThanOrEqual(1);
    expect(z!.zone).toBeLessThanOrEqual(5);
  });

  it("HR por debajo de Z1 devuelve null", () => {
    const z = classifyHrZone(60, zones);
    expect(z).toBeNull();
  });

  it("HR sobre Z5 devuelve Z5", () => {
    const z = classifyHrZone(250, zones);
    expect(z!.zone).toBe(5);
  });
});

describe("pace + speed", () => {
  it("10 km en 3600s → pace 360 s/km", () => {
    expect(paceSecPerKm(10, 3600)).toBe(360);
  });
  it("pace 360 s/km → 10 km/h", () => {
    expect(speedKmH(360)).toBe(10);
  });
  it("distancia 0 devuelve null", () => {
    expect(paceSecPerKm(0, 1000)).toBeNull();
  });
});

describe("Riegel predictor", () => {
  it("5k en 25:00 → 10k en ~52:00 (con default exponent)", () => {
    const t = riegelPredict(5, 1500, 10);
    // 1500 × 2^1.06 ≈ 3133 s ≈ 52:13
    expect(t).toBeGreaterThan(3080);
    expect(t).toBeLessThan(3180);
  });

  it("Riegel escala simétrica inversa", () => {
    // Ida
    const t10From5 = riegelPredict(5, 1500, 10);
    // Vuelta desde el 10k predicho debería dar ~5k original
    const t5Back = riegelPredict(10, t10From5, 5);
    expect(t5Back).toBeCloseTo(1500, 0);
  });

  it("predictClassicRaces devuelve todas las distancias", () => {
    const preds = predictClassicRaces(5, 1500);
    expect(preds["5k"]).toBeGreaterThan(1450);
    expect(preds["5k"]).toBeLessThan(1550);
    expect(preds.marathon).toBeGreaterThan(preds.half);
    expect(preds.half).toBeGreaterThan(preds["10k"]);
    expect(preds["10k"]).toBeGreaterThan(preds["5k"]);
  });

  it("distancias clásicas tienen los valores correctos", () => {
    expect(CLASSIC_RACES["5k"]).toBe(5);
    expect(CLASSIC_RACES.marathon).toBe(42.195);
  });
});

describe("VO₂max estimation", () => {
  it("5k en 20:00 da VO₂max razonable (~50-55)", () => {
    const vo2 = estimateVo2MaxFromRace(5, 1200);
    expect(vo2).not.toBeNull();
    expect(vo2!).toBeGreaterThan(45);
    expect(vo2!).toBeLessThan(62);
  });

  it("10k en 40:00 da VO₂max razonable (~55-60)", () => {
    const vo2 = estimateVo2MaxFromRace(10, 2400);
    expect(vo2).not.toBeNull();
    expect(vo2!).toBeGreaterThan(50);
    expect(vo2!).toBeLessThan(65);
  });

  it("maratón en 3h debería dar VO₂max ~50-55", () => {
    const vo2 = estimateVo2MaxFromRace(42.195, 10_800);
    expect(vo2).not.toBeNull();
    expect(vo2!).toBeGreaterThan(40);
    expect(vo2!).toBeLessThan(60);
  });

  it("tiempo fuera de rango (< 3 min) devuelve null", () => {
    expect(estimateVo2MaxFromRace(1, 120)).toBeNull();
  });

  it("tiempo > 4h devuelve null", () => {
    expect(estimateVo2MaxFromRace(50, 18_000)).toBeNull();
  });
});

describe("classifyVo2Max", () => {
  it("VO₂ 58 masculino 30 años = excellent", () => {
    expect(classifyVo2Max(58, 30, "male")).toBe("excellent");
  });
  it("VO₂ 35 masculino 30 años = poor", () => {
    expect(classifyVo2Max(35, 30, "male")).toBe("poor");
  });
  it("VO₂ 45 femenino 30 años = good", () => {
    expect(classifyVo2Max(45, 30, "female")).toBe("good");
  });
  it("ajusta por edad (misma VO₂ mejor categoría en mayores)", () => {
    const young = classifyVo2Max(44, 25, "male");
    const old = classifyVo2Max(44, 55, "male");
    // Young 44 debajo de average (42); old 44 arriba de average ajustado → categoría igual o mejor
    const rank = ["poor", "fair", "average", "good", "excellent"];
    expect(rank.indexOf(old)).toBeGreaterThanOrEqual(rank.indexOf(young));
  });
});

describe("splits analysis", () => {
  it("detecta negative split", () => {
    const splits: SplitRow[] = [
      { km: 1, paceSec: 360 },
      { km: 2, paceSec: 355 },
      { km: 3, paceSec: 345 },
      { km: 4, paceSec: 340 },
    ];
    expect(detectNegativeSplit(splits)).toBe(true);
  });

  it("no es negative split si se ralentizó", () => {
    const splits: SplitRow[] = [
      { km: 1, paceSec: 340 },
      { km: 2, paceSec: 345 },
      { km: 3, paceSec: 350 },
      { km: 4, paceSec: 360 },
    ];
    expect(detectNegativeSplit(splits)).toBe(false);
  });

  it("retorna false con menos de 4 splits", () => {
    expect(
      detectNegativeSplit([
        { km: 1, paceSec: 300 },
        { km: 2, paceSec: 290 },
      ]),
    ).toBe(false);
  });

  it("fatigueDrift >1 si se ralentizó", () => {
    const splits: SplitRow[] = [
      { km: 1, paceSec: 300 },
      { km: 2, paceSec: 330 },
    ];
    expect(fatigueDrift(splits)).toBeGreaterThan(1);
  });

  it("fatigueDrift <1 si aceleró", () => {
    const splits: SplitRow[] = [
      { km: 1, paceSec: 330 },
      { km: 2, paceSec: 300 },
    ];
    expect(fatigueDrift(splits)).toBeLessThan(1);
  });
});

describe("shoe health", () => {
  it("0/800 km = new", () => {
    expect(shoeHealth(0, 800, false).status).toBe("new");
  });
  it("400/800 = good", () => {
    expect(shoeHealth(400, 800, false).status).toBe("good");
  });
  it("600/800 (75%) = aging", () => {
    expect(shoeHealth(600, 800, false).status).toBe("aging");
  });
  it("750/800 (93%) = retire_soon", () => {
    expect(shoeHealth(750, 800, false).status).toBe("retire_soon");
  });
  it(">maxKm = over", () => {
    expect(shoeHealth(850, 800, false).status).toBe("over");
  });
  it("retirada manualmente = retired", () => {
    expect(shoeHealth(100, 800, true).status).toBe("retired");
  });
  it("remainingKm es consistente con currentKm", () => {
    const h = shoeHealth(300, 800, false);
    expect(h.remainingKm).toBe(500);
  });
});
