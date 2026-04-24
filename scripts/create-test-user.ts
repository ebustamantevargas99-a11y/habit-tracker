/**
 * Crea/restaura un usuario de prueba con datos sembrados en la DB.
 * Ejecución:
 *   npx tsx scripts/create-test-user.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const TEST_EMAIL = "tester@ultimatetracker.app";
const TEST_PASSWORD = "TestUT2026!";
const TEST_NAME = "Usuario de Prueba";

const prisma = new PrismaClient();

async function main() {
  console.log("[seed] Buscando usuario de prueba…");
  const existing = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
  if (existing) {
    console.log(`[seed] Eliminando cuenta anterior ${existing.id} para reset limpio…`);
    await prisma.user.delete({ where: { id: existing.id } });
  }

  console.log("[seed] Creando usuario nuevo…");
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 13);

  const birthDate = new Date("1998-03-15");
  const user = await prisma.user.create({
    data: {
      email: TEST_EMAIL,
      name: TEST_NAME,
      passwordHash,
      profile: {
        create: {
          onboardingCompleted: true,
          birthDate,
          biologicalSex: "male",
          heightCm: 175,
          weightKg: 72,
          activityLevel: "moderate",
          fitnessLevel: "intermediate",
          units: "metric",
          language: "es",
          timezone: "America/Mexico_City",
          interests: ["training", "nutrition", "productivity"],
          enabledModules: [
            "home",
            "habits",
            "tasks",
            "settings",
            "gamification",
            "fitness",
            "nutrition",
            "projects",
            "planner",
          ],
          primaryGoals: ["ganar 3kg de masa muscular", "dormir 8h constantes", "leer 12 libros"],
        },
      },
      gamification: {
        create: {
          totalXP: 180,
          currentLevel: 2,
        },
      },
    },
  });
  console.log(`[seed] User creado: ${user.id}`);

  console.log("[seed] Sembrando hábitos…");
  const today = new Date().toISOString().split("T")[0];
  const habits = await Promise.all([
    prisma.habit.create({
      data: {
        userId: user.id,
        name: "Meditar 10 min",
        icon: "🧘",
        category: "mindfulness",
        timeOfDay: "morning",
        frequency: "daily",
        targetDays: [0, 1, 2, 3, 4, 5, 6],
        streakCurrent: 12,
        streakBest: 18,
      },
    }),
    prisma.habit.create({
      data: {
        userId: user.id,
        name: "Entrenar fuerza",
        icon: "💪",
        category: "fitness",
        timeOfDay: "evening",
        frequency: "custom",
        targetDays: [1, 3, 5],
        streakCurrent: 3,
        streakBest: 8,
      },
    }),
    prisma.habit.create({
      data: {
        userId: user.id,
        name: "Leer 30 min",
        icon: "📚",
        category: "learning",
        timeOfDay: "night",
        frequency: "daily",
        targetDays: [0, 1, 2, 3, 4, 5, 6],
        streakCurrent: 5,
        streakBest: 22,
      },
    }),
  ]);

  // Logs últimos 14 días con completitud mixta
  const logs: { habitId: string; userId: string; date: string; completed: boolean }[] = [];
  for (let daysBack = 13; daysBack >= 0; daysBack--) {
    const d = new Date();
    d.setDate(d.getDate() - daysBack);
    const date = d.toISOString().split("T")[0];
    for (const habit of habits) {
      const completed = Math.random() > 0.25;
      logs.push({ habitId: habit.id, userId: user.id, date, completed });
    }
  }
  await prisma.habitLog.createMany({ data: logs });

  console.log("[seed] Sembrando cuenta + transacciones finanzas…");
  const account = await prisma.financialAccount.create({
    data: {
      userId: user.id,
      name: "Cuenta principal",
      type: "checking",
      currency: "MXN",
      balance: 12000,
      icon: "💳",
    },
  });
  const txs = [
    { description: "Sueldo mensual", amount: 2500, type: "income", category: "Salario" },
    { description: "Supermercado", amount: 180, type: "expense", category: "Alimentación" },
    { description: "Gasolina", amount: 60, type: "expense", category: "Transporte" },
    { description: "Suscripción gym", amount: 45, type: "expense", category: "Salud" },
    { description: "Cena restaurante", amount: 38, type: "expense", category: "Ocio" },
  ];
  for (const tx of txs) {
    await prisma.transaction.create({
      data: { ...tx, userId: user.id, accountId: account.id, date: today },
    });
  }
  await prisma.budget.create({
    data: {
      userId: user.id,
      month: today.slice(0, 7),
      category: "Alimentación",
      limit: 400,
    },
  });

  console.log("[seed] Sembrando workout de ayer con volumen…");
  const ydayDate = new Date();
  ydayDate.setDate(ydayDate.getDate() - 1);
  const yday = ydayDate.toISOString().split("T")[0];
  const benchExercise = await prisma.exercise.upsert({
    where: { id: "seed-bench-press" },
    create: {
      id: "seed-bench-press",
      name: "Press de banca",
      muscleGroup: "Pecho",
      category: "compound",
      equipment: "barbell",
      isCustom: false,
    },
    update: {},
  });
  await prisma.workout.create({
    data: {
      userId: user.id,
      date: yday,
      name: "Upper body",
      durationMinutes: 55,
      totalVolume: 2400,
      completed: true,
      prsHit: 0,
      exercises: {
        create: [
          {
            exerciseId: benchExercise.id,
            orderIndex: 0,
            sets: {
              create: [
                { setNumber: 1, weight: 60, reps: 8, rpe: 7 },
                { setNumber: 2, weight: 70, reps: 6, rpe: 8 },
                { setNumber: 3, weight: 70, reps: 5, rpe: 8.5 },
              ],
            },
          },
        ],
      },
    },
  });

  console.log("[seed] Sembrando tareas…");
  const project = await prisma.project.create({
    data: {
      userId: user.id,
      name: "Ultimate TRACKER",
      description: "Lanzamiento beta pública",
      status: "active",
      tasks: {
        create: [
          { title: "Terminar onboarding", status: "done", orderIndex: 0 },
          { title: "Probar fitness pro", status: "in_progress", orderIndex: 1 },
          { title: "Invitar primeros 10 usuarios", status: "todo", orderIndex: 2 },
        ],
      },
    },
  });

  console.log("");
  console.log("============================================");
  console.log("  USUARIO DE PRUEBA CREADO");
  console.log("============================================");
  console.log(`  Email:    ${TEST_EMAIL}`);
  console.log(`  Password: ${TEST_PASSWORD}`);
  console.log(`  ID:       ${user.id}`);
  console.log(`  Proyecto: ${project.id}`);
  console.log("============================================");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
