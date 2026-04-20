import { test, expect } from "@playwright/test";
import { login, track, clickSidebar, bug, ok, missing } from "./helpers";

test.describe.configure({ mode: "serial" });

test.describe("CRUD — Hábitos", () => {
  test("crear un hábito nuevo", async ({ page }) => {
    track(page, "habits-crud");
    await login(page);
    await clickSidebar(page, "Productividad");
    await page.waitForTimeout(1200);
    await page.getByText(/Habit Tracker/i).first().click().catch(() => {});
    await page.waitForTimeout(800);

    const addBtn = page.getByRole("button", { name: /Agregar hábito/i });
    if ((await addBtn.count()) === 0) {
      missing("habits", "Botón 'Agregar hábito' no encontrado");
      return;
    }
    await addBtn.click();
    await page.waitForTimeout(500);

    const nameInput = page.getByPlaceholder(/Ej\.|Nombre/i).first();
    if ((await nameInput.count()) > 0) {
      await nameInput.fill("Test habit E2E");
    }
    const categoryBtn = page.getByText(/🧘 Bienestar|📚 Aprendizaje/i).first();
    if (await categoryBtn.count()) await categoryBtn.click();
    await page.waitForTimeout(300);

    const saveBtn = page.getByRole("button", { name: /Guardar hábito/i });
    if ((await saveBtn.count()) === 0) {
      bug("habits", "Botón 'Guardar hábito' no encontrado");
      return;
    }
    await saveBtn.click();
    await page.waitForTimeout(2000);

    const createdVisible = await page.getByText(/Test habit E2E/i).count();
    if (createdVisible === 0) {
      bug("habits", "Hábito creado no aparece en la lista tras guardar");
    } else ok("habits", "Hábito creado y visible");

    await page.screenshot({ path: "test-results/crud-habits-created.png" });
  });
});

test.describe("CRUD — Finanzas", () => {
  test("crear ingreso", async ({ page }) => {
    track(page, "finance-income");
    await login(page);
    await clickSidebar(page, "Finanzas");
    await page.waitForTimeout(1200);

    const incomeTab = page.getByText(/^Ingresos$/i).first();
    if (await incomeTab.count()) await incomeTab.click();
    await page.waitForTimeout(600);

    const addBtn = page.getByRole("button", { name: /Agregar Ingreso/i });
    if ((await addBtn.count()) === 0) {
      missing("finance-income", "Botón 'Agregar Ingreso' no visible");
      return;
    }
    await addBtn.click();
    await page.waitForTimeout(500);

    // Form inline aparece — rellena descripción, monto
    const inputs = page.locator("input:visible").filter({ hasText: "" });
    const allInputs = await page.locator("input:visible").all();
    // Buscar primero texto, primero number
    let filled = { description: false, amount: false };
    for (const inp of allInputs) {
      const type = await inp.getAttribute("type");
      const placeholder = await inp.getAttribute("placeholder");
      if (!filled.description && (type === "text" || !type) && placeholder && /descrip/i.test(placeholder)) {
        await inp.fill("Freelance E2E test");
        filled.description = true;
      } else if (!filled.amount && type === "number") {
        await inp.fill("500");
        filled.amount = true;
      }
    }
    if (!filled.description) missing("finance-income", "Input descripción no encontrado");

    // El submit es un botón verde con Check icon — buscar por color o por posición
    const saveCandidates = await page.getByRole("button").all();
    for (const btn of saveCandidates) {
      const cls = await btn.getAttribute("class").catch(() => null);
      if (cls && cls.includes("success") && cls.includes("rounded")) {
        await btn.click();
        break;
      }
    }
    await page.waitForTimeout(2000);

    const appeared = await page.getByText(/Freelance E2E test/i).count();
    if (appeared === 0) {
      bug("finance-income", "Ingreso creado no aparece en la tabla");
    } else ok("finance-income", "Ingreso creado y visible");
    await page.screenshot({ path: "test-results/crud-finance-income.png" });
  });
});

test.describe("CRUD — Wellness / Mood", () => {
  test("registrar mood del día", async ({ page }) => {
    track(page, "wellness-mood");
    await login(page);
    await clickSidebar(page, "Bienestar");
    await page.waitForTimeout(1500);

    // Buscar botón o slider de mood
    const moodBtns = await page.getByRole("button").filter({ hasText: /^[😀-🙏]$/u }).count();
    if (moodBtns === 0) {
      // Probar sliders o números 1-10
      const scoreBtn = page.getByRole("button", { name: /^[5-9]$/ }).first();
      if ((await scoreBtn.count()) === 0) {
        missing("wellness-mood", "Controles de mood no encontrados");
        return;
      }
      await scoreBtn.click();
    } else {
      await page.getByRole("button").filter({ hasText: /^[😀-🙏]$/u }).first().click();
    }
    await page.waitForTimeout(600);

    const saveBtn = page.getByRole("button", { name: /Guardar/i }).first();
    if (await saveBtn.count()) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
      ok("wellness-mood", "Mood registrado");
    }
    await page.screenshot({ path: "test-results/crud-wellness-mood.png" });
  });
});

test.describe("CRUD — Fitness weight log", () => {
  test("registrar peso corporal", async ({ page }) => {
    track(page, "fitness-weight");
    await login(page);
    await clickSidebar(page, "Fitness");
    await page.waitForTimeout(1500);
    const tab = page.getByText(/^Peso$/i).first();
    if ((await tab.count()) === 0) {
      missing("fitness-weight", "Tab 'Peso' no encontrado");
      return;
    }
    await tab.click();
    await page.waitForTimeout(1000);

    const weightInput = page.getByPlaceholder(/Peso de hoy|kg/i);
    if ((await weightInput.count()) === 0) {
      missing("fitness-weight", "Input de peso no encontrado");
      return;
    }
    await weightInput.fill("72.5");

    const saveBtn = page.getByRole("button", { name: /Registrar|Guardar/i }).first();
    if (await saveBtn.count()) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
      ok("fitness-weight", "Peso registrado");
    } else {
      missing("fitness-weight", "Botón registrar no encontrado");
    }
    await page.screenshot({ path: "test-results/crud-fitness-weight.png" });
  });
});

test.describe("CRUD — Nutrition food item", () => {
  test("crear alimento custom", async ({ page }) => {
    track(page, "nutrition-food");
    await login(page);
    await clickSidebar(page, "Nutrición");
    await page.waitForTimeout(1500);

    const foodsTab = page.getByText(/Mis Alimentos/i).first();
    if ((await foodsTab.count()) === 0) {
      missing("nutrition-food", "Tab 'Mis Alimentos' no encontrado");
      return;
    }
    await foodsTab.click();
    await page.waitForTimeout(1000);

    const newBtn = page.getByRole("button", { name: /Nuevo alimento|Agregar/i }).first();
    if ((await newBtn.count()) === 0) {
      missing("nutrition-food", "Botón 'Nuevo alimento' no encontrado");
      return;
    }
    await newBtn.click();
    await page.waitForTimeout(800);

    const nameInput = page.getByPlaceholder(/^Nombre|alimento/i).first();
    if ((await nameInput.count()) > 0) await nameInput.fill("Test food E2E");

    const caloriesInputs = await page.locator('input[type="number"]').all();
    if (caloriesInputs.length > 0) await caloriesInputs[0].fill("250");

    const saveBtn = page.getByRole("button", { name: /Guardar/i }).first();
    if (await saveBtn.count()) {
      await saveBtn.click();
      await page.waitForTimeout(2500);
      const appeared = await page.getByText(/Test food E2E/i).count();
      if (appeared === 0) bug("nutrition-food", "Alimento creado no aparece");
      else ok("nutrition-food", "Alimento creado y visible");
    }
    await page.screenshot({ path: "test-results/crud-nutrition-food.png" });
  });
});

test.describe("CRUD — Organization (notes)", () => {
  test("crear nota", async ({ page }) => {
    track(page, "organization-note");
    await login(page);
    await clickSidebar(page, "Organización");
    await page.waitForTimeout(1500);

    const notesTab = page.getByText(/^Notas$/i).first();
    if (await notesTab.count()) {
      await notesTab.click();
      await page.waitForTimeout(800);
    }

    const newBtn = page.getByRole("button", { name: /Nueva nota/i }).first();
    if ((await newBtn.count()) === 0) {
      missing("organization-note", "Botón 'Nueva nota' no encontrado");
      return;
    }
    await newBtn.click();
    await page.waitForTimeout(600);

    const titleInput = page.getByPlaceholder(/Título de la nota/i);
    if ((await titleInput.count()) > 0) await titleInput.fill("Nota E2E test");
    const contentInput = page.getByPlaceholder(/Contenido/i);
    if ((await contentInput.count()) > 0) await contentInput.fill("Contenido de prueba");

    const save = page.getByRole("button", { name: /^Guardar$/i }).first();
    if (await save.count()) {
      await save.click();
      await page.waitForTimeout(2500);
      const appeared = await page.getByText(/Nota E2E test/i).count();
      if (appeared === 0) bug("organization-note", "Nota creada no aparece en la lista");
      else ok("organization-note", "Nota creada y visible");
    }
    await page.screenshot({ path: "test-results/crud-organization-note.png" });
  });
});

test.describe("CRUD — Productivity (project)", () => {
  test("crear proyecto", async ({ page }) => {
    track(page, "productivity-project");
    await login(page);
    await clickSidebar(page, "Productividad");
    await page.waitForTimeout(1500);

    const projectsTab = page.getByText(/Project Management/i).first();
    if (await projectsTab.count()) {
      await projectsTab.click();
      await page.waitForTimeout(1000);
    }

    const newProjectBtn = page
      .getByRole("button", { name: /Nueva proyecto|Nuevo proyecto|Crear proyecto/i })
      .first();
    if ((await newProjectBtn.count()) === 0) {
      missing("productivity-project", "Botón crear proyecto no encontrado");
      return;
    }
    await newProjectBtn.click();
    await page.waitForTimeout(600);

    const nameInput = page.getByPlaceholder(/Nombre del proyecto/i);
    if ((await nameInput.count()) > 0) await nameInput.fill("Proyecto E2E");
    const descInput = page.getByPlaceholder(/Descripción/i);
    if ((await descInput.count()) > 0) await descInput.fill("Proyecto de prueba");

    const saveBtn = page.getByRole("button", { name: /Crear|Guardar/i }).first();
    if (await saveBtn.count()) {
      await saveBtn.click();
      await page.waitForTimeout(2500);
      const appeared = await page.getByText(/Proyecto E2E/i).count();
      if (appeared === 0) bug("productivity-project", "Proyecto no aparece tras crear");
      else ok("productivity-project", "Proyecto creado");
    }
    await page.screenshot({ path: "test-results/crud-productivity-project.png" });
  });
});

test.describe("CRUD — Vision / OKR", () => {
  test("crear objetivo", async ({ page }) => {
    track(page, "vision-okr");
    await login(page);
    await clickSidebar(page, "Visión");
    await page.waitForTimeout(1500);

    const okrTab = page.getByText(/OKR/i).first();
    if (await okrTab.count()) await okrTab.click();
    await page.waitForTimeout(1000);

    const createBtn = page.getByRole("button", { name: /Crear Objetivo|Nuevo objetivo/i }).first();
    if ((await createBtn.count()) === 0) {
      missing("vision-okr", "Botón crear objetivo no encontrado");
      return;
    }
    await createBtn.click();
    await page.waitForTimeout(600);

    const titleInput = page.getByPlaceholder(/Mi objetivo|Título/i);
    if ((await titleInput.count()) > 0) await titleInput.fill("Objetivo E2E");

    const saveBtn = page.getByRole("button", { name: /Guardar|Crear/i }).first();
    if (await saveBtn.count()) {
      await saveBtn.click();
      await page.waitForTimeout(2500);
      const appeared = await page.getByText(/Objetivo E2E/i).count();
      if (appeared === 0) bug("vision-okr", "OKR no aparece tras crear");
      else ok("vision-okr", "OKR creado");
    }
    await page.screenshot({ path: "test-results/crud-vision-okr.png" });
  });
});
