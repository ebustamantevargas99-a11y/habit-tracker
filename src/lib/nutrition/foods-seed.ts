// Catálogo base de alimentos comunes — macros por 100g (o por porción estándar).
// Datos aproximados; los valores exactos deberían venir de OpenFoodFacts o similar.

export type FoodSeed = {
  slug: string;
  name: string;
  brand?: string;
  category: FoodCategory;
  servingSize: number; // en gramos
  servingUnit: "g" | "ml" | "piece" | "cup" | "tbsp";
  calories: number;
  protein: number; // g
  carbs: number; // g
  fat: number; // g
  fiber: number; // g
  sugar: number; // g
  sodium: number; // mg
  tags?: string[]; // ["high-protein","keto","veggie","vegano","gluten-free",...]
};

export type FoodCategory =
  | "protein"       // carnes, huevos, pescado
  | "dairy"         // leche, yogur, queso
  | "grain"         // cereales, pan, pasta, arroz
  | "vegetable"     // vegetales
  | "fruit"         // frutas
  | "legume"        // legumbres
  | "nut_seed"      // frutos secos / semillas
  | "oil_fat"       // aceites / grasas
  | "beverage"      // bebidas
  | "sweet"         // dulces / postres
  | "processed"     // comida procesada
  | "prepared";     // platos preparados

export const FOODS_SEED: FoodSeed[] = [
  // ── PROTEÍNAS (carnes, huevos, pescado) ─────────────────────────────────────
  { slug: "pollo-pechuga", name: "Pechuga de pollo", category: "protein", servingSize: 100, servingUnit: "g", calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0, sodium: 74, tags: ["high-protein"] },
  { slug: "pollo-muslo", name: "Muslo de pollo (sin piel)", category: "protein", servingSize: 100, servingUnit: "g", calories: 209, protein: 26, carbs: 0, fat: 10.9, fiber: 0, sugar: 0, sodium: 88, tags: ["high-protein"] },
  { slug: "res-molida-90", name: "Carne de res molida 90/10", category: "protein", servingSize: 100, servingUnit: "g", calories: 176, protein: 20, carbs: 0, fat: 10, fiber: 0, sugar: 0, sodium: 75, tags: ["high-protein"] },
  { slug: "res-molida-80", name: "Carne de res molida 80/20", category: "protein", servingSize: 100, servingUnit: "g", calories: 254, protein: 17, carbs: 0, fat: 20, fiber: 0, sugar: 0, sodium: 66, tags: ["high-protein"] },
  { slug: "res-bistec", name: "Bistec de res", category: "protein", servingSize: 100, servingUnit: "g", calories: 271, protein: 26, carbs: 0, fat: 19, fiber: 0, sugar: 0, sodium: 58, tags: ["high-protein"] },
  { slug: "cerdo-lomo", name: "Lomo de cerdo", category: "protein", servingSize: 100, servingUnit: "g", calories: 143, protein: 26, carbs: 0, fat: 3.5, fiber: 0, sugar: 0, sodium: 55, tags: ["high-protein"] },
  { slug: "cerdo-tocino", name: "Tocino (bacon)", category: "protein", servingSize: 100, servingUnit: "g", calories: 541, protein: 37, carbs: 1.4, fat: 42, fiber: 0, sugar: 0, sodium: 1717, tags: ["high-protein","keto"] },
  { slug: "pavo-pechuga", name: "Pechuga de pavo", category: "protein", servingSize: 100, servingUnit: "g", calories: 135, protein: 30, carbs: 0, fat: 1, fiber: 0, sugar: 0, sodium: 60, tags: ["high-protein","lean"] },
  { slug: "huevo-entero", name: "Huevo entero grande", category: "protein", servingSize: 50, servingUnit: "piece", calories: 72, protein: 6.3, carbs: 0.4, fat: 4.8, fiber: 0, sugar: 0.2, sodium: 71, tags: ["high-protein","keto"] },
  { slug: "clara-huevo", name: "Clara de huevo", category: "protein", servingSize: 33, servingUnit: "piece", calories: 17, protein: 3.6, carbs: 0.2, fat: 0.1, fiber: 0, sugar: 0.2, sodium: 55, tags: ["high-protein","lean"] },
  { slug: "salmon", name: "Salmón", category: "protein", servingSize: 100, servingUnit: "g", calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0, sugar: 0, sodium: 59, tags: ["high-protein","omega3"] },
  { slug: "atun-lata-agua", name: "Atún en lata (agua)", category: "protein", servingSize: 100, servingUnit: "g", calories: 116, protein: 26, carbs: 0, fat: 0.8, fiber: 0, sugar: 0, sodium: 247, tags: ["high-protein","lean"] },
  { slug: "atun-lata-aceite", name: "Atún en lata (aceite)", category: "protein", servingSize: 100, servingUnit: "g", calories: 198, protein: 29, carbs: 0, fat: 8.2, fiber: 0, sugar: 0, sodium: 354, tags: ["high-protein"] },
  { slug: "camarones", name: "Camarones", category: "protein", servingSize: 100, servingUnit: "g", calories: 99, protein: 24, carbs: 0.2, fat: 0.3, fiber: 0, sugar: 0, sodium: 111, tags: ["high-protein","lean"] },
  { slug: "mojarra", name: "Mojarra (tilapia)", category: "protein", servingSize: 100, servingUnit: "g", calories: 96, protein: 20, carbs: 0, fat: 1.7, fiber: 0, sugar: 0, sodium: 52, tags: ["high-protein","lean"] },

  // ── LÁCTEOS ─────────────────────────────────────────────────────────────────
  { slug: "leche-entera", name: "Leche entera", category: "dairy", servingSize: 240, servingUnit: "ml", calories: 146, protein: 7.9, carbs: 11.7, fat: 7.9, fiber: 0, sugar: 12, sodium: 98 },
  { slug: "leche-descremada", name: "Leche descremada", category: "dairy", servingSize: 240, servingUnit: "ml", calories: 83, protein: 8.3, carbs: 12.2, fat: 0.2, fiber: 0, sugar: 12.5, sodium: 103, tags: ["lean"] },
  { slug: "leche-almendra", name: "Leche de almendra (sin azúcar)", category: "dairy", servingSize: 240, servingUnit: "ml", calories: 30, protein: 1, carbs: 1, fat: 2.5, fiber: 0.4, sugar: 0, sodium: 160, tags: ["vegano","keto"] },
  { slug: "yogur-griego", name: "Yogur griego natural", category: "dairy", servingSize: 170, servingUnit: "g", calories: 100, protein: 17, carbs: 6, fat: 0.7, fiber: 0, sugar: 6, sodium: 61, tags: ["high-protein"] },
  { slug: "yogur-griego-entero", name: "Yogur griego entero", category: "dairy", servingSize: 170, servingUnit: "g", calories: 150, protein: 15, carbs: 8, fat: 7, fiber: 0, sugar: 8, sodium: 65, tags: ["high-protein"] },
  { slug: "queso-cheddar", name: "Queso cheddar", category: "dairy", servingSize: 28, servingUnit: "g", calories: 113, protein: 7, carbs: 0.4, fat: 9, fiber: 0, sugar: 0.1, sodium: 180, tags: ["keto"] },
  { slug: "queso-mozzarella", name: "Queso mozzarella", category: "dairy", servingSize: 28, servingUnit: "g", calories: 85, protein: 6.3, carbs: 0.6, fat: 6.3, fiber: 0, sugar: 0.3, sodium: 178, tags: ["keto"] },
  { slug: "queso-fresco", name: "Queso fresco (panela)", category: "dairy", servingSize: 100, servingUnit: "g", calories: 321, protein: 20, carbs: 2.3, fat: 25, fiber: 0, sugar: 2.3, sodium: 620 },
  { slug: "queso-cottage", name: "Queso cottage", category: "dairy", servingSize: 100, servingUnit: "g", calories: 98, protein: 11, carbs: 3.4, fat: 4.3, fiber: 0, sugar: 2.7, sodium: 364, tags: ["high-protein"] },
  { slug: "mantequilla", name: "Mantequilla", category: "dairy", servingSize: 14, servingUnit: "tbsp", calories: 102, protein: 0.1, carbs: 0, fat: 11.5, fiber: 0, sugar: 0, sodium: 91, tags: ["keto"] },

  // ── GRANOS Y CEREALES ──────────────────────────────────────────────────────
  { slug: "arroz-blanco-cocido", name: "Arroz blanco cocido", category: "grain", servingSize: 100, servingUnit: "g", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, sugar: 0.1, sodium: 1 },
  { slug: "arroz-integral-cocido", name: "Arroz integral cocido", category: "grain", servingSize: 100, servingUnit: "g", calories: 123, protein: 2.6, carbs: 26, fat: 1, fiber: 1.8, sugar: 0.2, sodium: 4 },
  { slug: "avena-seca", name: "Avena (cruda)", category: "grain", servingSize: 40, servingUnit: "g", calories: 152, protein: 5.3, carbs: 27, fat: 2.6, fiber: 4.1, sugar: 0.4, sodium: 1 },
  { slug: "pan-integral", name: "Pan integral", category: "grain", servingSize: 30, servingUnit: "piece", calories: 79, protein: 4, carbs: 14, fat: 1.1, fiber: 2.3, sugar: 1.5, sodium: 144 },
  { slug: "pan-blanco", name: "Pan blanco", category: "grain", servingSize: 30, servingUnit: "piece", calories: 79, protein: 2.6, carbs: 15, fat: 1, fiber: 0.8, sugar: 1.4, sodium: 152 },
  { slug: "tortilla-maiz", name: "Tortilla de maíz", category: "grain", servingSize: 30, servingUnit: "piece", calories: 65, protein: 1.6, carbs: 13.5, fat: 0.8, fiber: 1.8, sugar: 0.3, sodium: 11 },
  { slug: "tortilla-harina", name: "Tortilla de harina", category: "grain", servingSize: 35, servingUnit: "piece", calories: 104, protein: 2.8, carbs: 17.8, fat: 2.3, fiber: 1, sugar: 0.8, sodium: 204 },
  { slug: "pasta-cocida", name: "Pasta cocida", category: "grain", servingSize: 100, servingUnit: "g", calories: 131, protein: 5, carbs: 25, fat: 1.1, fiber: 1.8, sugar: 0.6, sodium: 6 },
  { slug: "quinoa-cocida", name: "Quinoa cocida", category: "grain", servingSize: 100, servingUnit: "g", calories: 120, protein: 4.4, carbs: 21.3, fat: 1.9, fiber: 2.8, sugar: 0.9, sodium: 7, tags: ["veggie","gluten-free"] },
  { slug: "cereal-corn-flakes", name: "Corn Flakes (sin leche)", category: "grain", brand: "Kellogg's", servingSize: 30, servingUnit: "cup", calories: 110, protein: 2, carbs: 26, fat: 0, fiber: 1, sugar: 3, sodium: 200 },
  { slug: "cereal-cheerios", name: "Cheerios", category: "grain", brand: "General Mills", servingSize: 28, servingUnit: "cup", calories: 100, protein: 3, carbs: 20, fat: 2, fiber: 3, sugar: 1, sodium: 140 },

  // ── VEGETALES ───────────────────────────────────────────────────────────────
  { slug: "brocoli", name: "Brócoli", category: "vegetable", servingSize: 100, servingUnit: "g", calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, sugar: 1.7, sodium: 33, tags: ["veggie","keto"] },
  { slug: "espinaca", name: "Espinaca", category: "vegetable", servingSize: 100, servingUnit: "g", calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, sugar: 0.4, sodium: 79, tags: ["veggie","keto"] },
  { slug: "lechuga", name: "Lechuga romana", category: "vegetable", servingSize: 100, servingUnit: "g", calories: 17, protein: 1.2, carbs: 3.3, fat: 0.3, fiber: 2.1, sugar: 1.2, sodium: 8, tags: ["veggie","keto"] },
  { slug: "tomate", name: "Tomate", category: "vegetable", servingSize: 100, servingUnit: "g", calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, sugar: 2.6, sodium: 5, tags: ["veggie"] },
  { slug: "cebolla", name: "Cebolla", category: "vegetable", servingSize: 100, servingUnit: "g", calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7, sugar: 4.2, sodium: 4, tags: ["veggie"] },
  { slug: "pepino", name: "Pepino", category: "vegetable", servingSize: 100, servingUnit: "g", calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1, fiber: 0.5, sugar: 1.7, sodium: 2, tags: ["veggie","keto"] },
  { slug: "pimiento", name: "Pimiento morrón", category: "vegetable", servingSize: 100, servingUnit: "g", calories: 31, protein: 1, carbs: 6, fat: 0.3, fiber: 2.1, sugar: 4.2, sodium: 4, tags: ["veggie"] },
  { slug: "zanahoria", name: "Zanahoria", category: "vegetable", servingSize: 100, servingUnit: "g", calories: 41, protein: 0.9, carbs: 9.6, fat: 0.2, fiber: 2.8, sugar: 4.7, sodium: 69, tags: ["veggie"] },
  { slug: "calabacita", name: "Calabacita (zucchini)", category: "vegetable", servingSize: 100, servingUnit: "g", calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3, fiber: 1, sugar: 2.5, sodium: 8, tags: ["veggie","keto"] },
  { slug: "papa-cocida", name: "Papa cocida", category: "vegetable", servingSize: 100, servingUnit: "g", calories: 87, protein: 1.9, carbs: 20, fat: 0.1, fiber: 1.8, sugar: 0.9, sodium: 5 },
  { slug: "camote", name: "Camote / batata", category: "vegetable", servingSize: 100, servingUnit: "g", calories: 86, protein: 1.6, carbs: 20, fat: 0.1, fiber: 3, sugar: 4.2, sodium: 55 },
  { slug: "aguacate", name: "Aguacate", category: "vegetable", servingSize: 100, servingUnit: "g", calories: 160, protein: 2, carbs: 8.5, fat: 14.7, fiber: 6.7, sugar: 0.7, sodium: 7, tags: ["keto","veggie"] },
  { slug: "champinon", name: "Champiñón", category: "vegetable", servingSize: 100, servingUnit: "g", calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3, fiber: 1, sugar: 2, sodium: 5, tags: ["veggie","keto"] },

  // ── FRUTAS ─────────────────────────────────────────────────────────────────
  { slug: "manzana", name: "Manzana", category: "fruit", servingSize: 100, servingUnit: "g", calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, sugar: 10, sodium: 1, tags: ["veggie"] },
  { slug: "platano", name: "Plátano", category: "fruit", servingSize: 100, servingUnit: "g", calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, sugar: 12, sodium: 1, tags: ["veggie"] },
  { slug: "naranja", name: "Naranja", category: "fruit", servingSize: 100, servingUnit: "g", calories: 47, protein: 0.9, carbs: 12, fat: 0.1, fiber: 2.4, sugar: 9, sodium: 0, tags: ["veggie"] },
  { slug: "fresa", name: "Fresa", category: "fruit", servingSize: 100, servingUnit: "g", calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, fiber: 2, sugar: 4.9, sodium: 1, tags: ["veggie"] },
  { slug: "arandano", name: "Arándano", category: "fruit", servingSize: 100, servingUnit: "g", calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3, fiber: 2.4, sugar: 10, sodium: 1, tags: ["veggie"] },
  { slug: "uva", name: "Uva", category: "fruit", servingSize: 100, servingUnit: "g", calories: 69, protein: 0.7, carbs: 18, fat: 0.2, fiber: 0.9, sugar: 16, sodium: 2, tags: ["veggie"] },
  { slug: "pina", name: "Piña", category: "fruit", servingSize: 100, servingUnit: "g", calories: 50, protein: 0.5, carbs: 13, fat: 0.1, fiber: 1.4, sugar: 10, sodium: 1, tags: ["veggie"] },
  { slug: "mango", name: "Mango", category: "fruit", servingSize: 100, servingUnit: "g", calories: 60, protein: 0.8, carbs: 15, fat: 0.4, fiber: 1.6, sugar: 14, sodium: 1, tags: ["veggie"] },
  { slug: "sandia", name: "Sandía", category: "fruit", servingSize: 100, servingUnit: "g", calories: 30, protein: 0.6, carbs: 7.6, fat: 0.2, fiber: 0.4, sugar: 6.2, sodium: 1, tags: ["veggie"] },
  { slug: "papaya", name: "Papaya", category: "fruit", servingSize: 100, servingUnit: "g", calories: 43, protein: 0.5, carbs: 11, fat: 0.3, fiber: 1.7, sugar: 7.8, sodium: 8, tags: ["veggie"] },

  // ── LEGUMBRES ─────────────────────────────────────────────────────────────
  { slug: "frijol-negro-cocido", name: "Frijol negro cocido", category: "legume", servingSize: 100, servingUnit: "g", calories: 132, protein: 8.9, carbs: 23.7, fat: 0.5, fiber: 8.7, sugar: 0.3, sodium: 1, tags: ["veggie","vegano","high-fiber"] },
  { slug: "frijol-pinto-cocido", name: "Frijol pinto cocido", category: "legume", servingSize: 100, servingUnit: "g", calories: 143, protein: 9, carbs: 26, fat: 0.7, fiber: 9, sugar: 0.3, sodium: 1, tags: ["veggie","vegano","high-fiber"] },
  { slug: "garbanzo-cocido", name: "Garbanzo cocido", category: "legume", servingSize: 100, servingUnit: "g", calories: 164, protein: 8.9, carbs: 27.4, fat: 2.6, fiber: 7.6, sugar: 4.8, sodium: 7, tags: ["veggie","vegano","high-fiber"] },
  { slug: "lenteja-cocida", name: "Lenteja cocida", category: "legume", servingSize: 100, servingUnit: "g", calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 7.9, sugar: 1.8, sodium: 2, tags: ["veggie","vegano","high-fiber"] },

  // ── FRUTOS SECOS Y SEMILLAS ────────────────────────────────────────────────
  { slug: "almendra", name: "Almendras", category: "nut_seed", servingSize: 28, servingUnit: "g", calories: 164, protein: 6, carbs: 6.1, fat: 14.2, fiber: 3.5, sugar: 1.2, sodium: 0, tags: ["keto","veggie"] },
  { slug: "cacahuate", name: "Cacahuate", category: "nut_seed", servingSize: 28, servingUnit: "g", calories: 161, protein: 7.3, carbs: 4.6, fat: 14, fiber: 2.4, sugar: 1.3, sodium: 5, tags: ["keto","veggie"] },
  { slug: "nuez", name: "Nuez (walnut)", category: "nut_seed", servingSize: 28, servingUnit: "g", calories: 185, protein: 4.3, carbs: 3.9, fat: 18.5, fiber: 1.9, sugar: 0.7, sodium: 1, tags: ["keto","veggie"] },
  { slug: "pistache", name: "Pistache", category: "nut_seed", servingSize: 28, servingUnit: "g", calories: 159, protein: 5.7, carbs: 7.7, fat: 12.9, fiber: 3, sugar: 2.2, sodium: 0, tags: ["keto","veggie"] },
  { slug: "chia-semilla", name: "Chia (semilla)", category: "nut_seed", servingSize: 28, servingUnit: "g", calories: 138, protein: 4.7, carbs: 12, fat: 8.7, fiber: 9.8, sugar: 0, sodium: 5, tags: ["veggie","high-fiber"] },
  { slug: "linaza", name: "Linaza", category: "nut_seed", servingSize: 28, servingUnit: "g", calories: 150, protein: 5.1, carbs: 8.1, fat: 11.8, fiber: 7.7, sugar: 0.4, sodium: 8, tags: ["veggie","high-fiber"] },
  { slug: "cacahuate-crema", name: "Crema de cacahuate", category: "nut_seed", servingSize: 32, servingUnit: "tbsp", calories: 188, protein: 7, carbs: 7, fat: 16, fiber: 2, sugar: 3, sodium: 152, tags: ["veggie"] },

  // ── ACEITES Y GRASAS ──────────────────────────────────────────────────────
  { slug: "aceite-oliva", name: "Aceite de oliva", category: "oil_fat", servingSize: 14, servingUnit: "tbsp", calories: 119, protein: 0, carbs: 0, fat: 13.5, fiber: 0, sugar: 0, sodium: 0, tags: ["keto","veggie"] },
  { slug: "aceite-coco", name: "Aceite de coco", category: "oil_fat", servingSize: 14, servingUnit: "tbsp", calories: 117, protein: 0, carbs: 0, fat: 14, fiber: 0, sugar: 0, sodium: 0, tags: ["keto","veggie"] },
  { slug: "aceite-aguacate", name: "Aceite de aguacate", category: "oil_fat", servingSize: 14, servingUnit: "tbsp", calories: 124, protein: 0, carbs: 0, fat: 14, fiber: 0, sugar: 0, sodium: 0, tags: ["keto","veggie"] },

  // ── BEBIDAS ───────────────────────────────────────────────────────────────
  { slug: "agua", name: "Agua", category: "beverage", servingSize: 240, servingUnit: "ml", calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
  { slug: "cafe-negro", name: "Café negro (sin azúcar)", category: "beverage", servingSize: 240, servingUnit: "ml", calories: 2, protein: 0.3, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 5, tags: ["keto"] },
  { slug: "te-verde", name: "Té verde", category: "beverage", servingSize: 240, servingUnit: "ml", calories: 2, protein: 0.5, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 2, tags: ["keto"] },
  { slug: "coca-cola", name: "Coca-Cola", brand: "Coca-Cola", category: "beverage", servingSize: 355, servingUnit: "ml", calories: 140, protein: 0, carbs: 39, fat: 0, fiber: 0, sugar: 39, sodium: 45 },
  { slug: "coca-zero", name: "Coca-Cola Zero", brand: "Coca-Cola", category: "beverage", servingSize: 355, servingUnit: "ml", calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 40, tags: ["keto"] },
  { slug: "cerveza-clara", name: "Cerveza clara", category: "beverage", servingSize: 355, servingUnit: "ml", calories: 153, protein: 1.6, carbs: 12.6, fat: 0, fiber: 0, sugar: 0, sodium: 14 },
  { slug: "vino-tinto", name: "Vino tinto", category: "beverage", servingSize: 150, servingUnit: "ml", calories: 125, protein: 0.1, carbs: 3.8, fat: 0, fiber: 0, sugar: 0.9, sodium: 6 },

  // ── PROCESADOS / COMIDA RÁPIDA ──────────────────────────────────────────────
  { slug: "pizza-rebanada", name: "Pizza (rebanada)", category: "processed", servingSize: 107, servingUnit: "piece", calories: 285, protein: 12, carbs: 36, fat: 10, fiber: 2.5, sugar: 3.8, sodium: 640 },
  { slug: "hamburguesa", name: "Hamburguesa clásica", category: "prepared", servingSize: 200, servingUnit: "piece", calories: 540, protein: 25, carbs: 40, fat: 29, fiber: 2, sugar: 9, sodium: 920 },
  { slug: "hot-dog", name: "Hot dog", category: "prepared", servingSize: 100, servingUnit: "piece", calories: 290, protein: 10, carbs: 22, fat: 18, fiber: 1, sugar: 4, sodium: 740 },
  { slug: "papas-fritas", name: "Papas fritas (porción)", category: "processed", servingSize: 115, servingUnit: "g", calories: 365, protein: 4, carbs: 48, fat: 17, fiber: 4, sugar: 0.3, sodium: 246 },
  { slug: "taco-al-pastor", name: "Taco al pastor", category: "prepared", servingSize: 90, servingUnit: "piece", calories: 200, protein: 9, carbs: 15, fat: 11, fiber: 1.5, sugar: 1, sodium: 310 },
  { slug: "burrito-frijol", name: "Burrito de frijol", category: "prepared", servingSize: 180, servingUnit: "piece", calories: 380, protein: 13, carbs: 50, fat: 14, fiber: 6, sugar: 2, sodium: 870 },
  { slug: "sushi-roll", name: "Sushi roll (8 piezas)", category: "prepared", servingSize: 200, servingUnit: "piece", calories: 350, protein: 12, carbs: 60, fat: 7, fiber: 3, sugar: 6, sodium: 520 },

  // ── SNACKS / DULCES ────────────────────────────────────────────────────────
  { slug: "chocolate-oscuro", name: "Chocolate oscuro 70%", category: "sweet", servingSize: 28, servingUnit: "g", calories: 170, protein: 2.2, carbs: 13, fat: 12, fiber: 3.1, sugar: 7, sodium: 6 },
  { slug: "galleta-oreo", name: "Galleta Oreo (1)", brand: "Oreo", category: "sweet", servingSize: 11, servingUnit: "piece", calories: 53, protein: 0.5, carbs: 8.3, fat: 2.2, fiber: 0.3, sugar: 4.5, sodium: 36 },
  { slug: "helado-vainilla", name: "Helado de vainilla", category: "sweet", servingSize: 66, servingUnit: "cup", calories: 137, protein: 2.4, carbs: 16, fat: 7, fiber: 0.5, sugar: 14, sodium: 53 },
  { slug: "donut", name: "Donut glaseado", category: "sweet", servingSize: 60, servingUnit: "piece", calories: 260, protein: 2.7, carbs: 31, fat: 14, fiber: 0.7, sugar: 13, sodium: 230 },
  { slug: "muffin-chispas", name: "Muffin de chispas de chocolate", category: "sweet", servingSize: 100, servingUnit: "piece", calories: 410, protein: 5, carbs: 55, fat: 19, fiber: 2, sugar: 30, sodium: 320 },

  // ── SUPLEMENTOS COMUNES ────────────────────────────────────────────────────
  { slug: "whey-protein", name: "Whey Protein (1 scoop)", category: "protein", servingSize: 30, servingUnit: "g", calories: 120, protein: 24, carbs: 3, fat: 1.5, fiber: 0, sugar: 1, sodium: 50, tags: ["high-protein"] },
  { slug: "caseina", name: "Caseína (1 scoop)", category: "protein", servingSize: 34, servingUnit: "g", calories: 120, protein: 24, carbs: 4, fat: 1, fiber: 1, sugar: 2, sodium: 140, tags: ["high-protein"] },
  { slug: "barrita-proteina", name: "Barra de proteína", category: "protein", servingSize: 60, servingUnit: "piece", calories: 220, protein: 20, carbs: 20, fat: 8, fiber: 5, sugar: 8, sodium: 200, tags: ["high-protein"] },
];

export const FOODS_BY_CATEGORY = FOODS_SEED.reduce<Record<string, FoodSeed[]>>(
  (acc, f) => {
    if (!acc[f.category]) acc[f.category] = [];
    acc[f.category].push(f);
    return acc;
  },
  {}
);

export const FOOD_BY_SLUG: Record<string, FoodSeed> = FOODS_SEED.reduce<
  Record<string, FoodSeed>
>((acc, f) => {
  acc[f.slug] = f;
  return acc;
}, {});

export const CATEGORY_LABELS: Record<FoodCategory, string> = {
  protein: "Proteínas",
  dairy: "Lácteos",
  grain: "Granos y cereales",
  vegetable: "Vegetales",
  fruit: "Frutas",
  legume: "Legumbres",
  nut_seed: "Frutos secos y semillas",
  oil_fat: "Aceites y grasas",
  beverage: "Bebidas",
  sweet: "Dulces",
  processed: "Procesados",
  prepared: "Preparados",
};

export function searchFoods(query: string, limit = 20): FoodSeed[] {
  if (!query.trim()) return FOODS_SEED.slice(0, limit);
  const q = query.toLowerCase().trim();
  return FOODS_SEED.filter(
    (f) =>
      f.name.toLowerCase().includes(q) ||
      f.brand?.toLowerCase().includes(q) ||
      f.slug.includes(q) ||
      f.tags?.some((t) => t.includes(q))
  ).slice(0, limit);
}
