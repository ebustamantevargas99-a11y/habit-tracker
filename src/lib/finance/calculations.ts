// Cálculos financieros puros — testeables.

// ─── Proyección de metas ─────────────────────────────────────────────────────

export type GoalProjection = {
  /** Monto restante para alcanzar la meta. */
  remaining: number;
  /** Aportación mensual requerida si hay targetDate. */
  requiredMonthlySavings: number | null;
  /** Meses para llegar si mantiene savings rate actual. null = ya logrado. */
  monthsAtCurrentPace: number | null;
  /** Fecha estimada de logro si mantiene ritmo. */
  projectedDate: string | null;
  /** ¿Llega a tiempo con el ritmo actual? (null si no hay targetDate) */
  onTrack: boolean | null;
  /** Diferencia entre lo que debería ahorrar y lo que puede. */
  deficit: number | null;
};

export function projectGoal(
  currentAmount: number,
  targetAmount: number,
  targetDate: string | null,
  avgMonthlySavings: number,
  today: Date = new Date()
): GoalProjection {
  const remaining = Math.max(0, targetAmount - currentAmount);
  if (remaining <= 0) {
    return {
      remaining: 0,
      requiredMonthlySavings: null,
      monthsAtCurrentPace: null,
      projectedDate: null,
      onTrack: true,
      deficit: null,
    };
  }

  let requiredMonthlySavings: number | null = null;
  if (targetDate) {
    const target = new Date(targetDate + "T00:00:00");
    const monthsUntilTarget = Math.max(
      0.1,
      (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
    );
    requiredMonthlySavings = remaining / monthsUntilTarget;
  }

  const monthsAtCurrentPace =
    avgMonthlySavings > 0 ? remaining / avgMonthlySavings : null;

  let projectedDate: string | null = null;
  if (monthsAtCurrentPace !== null && monthsAtCurrentPace < 600) {
    const d = new Date(today);
    d.setMonth(d.getMonth() + Math.ceil(monthsAtCurrentPace));
    projectedDate = d.toISOString().split("T")[0];
  }

  const onTrack =
    targetDate && requiredMonthlySavings !== null
      ? avgMonthlySavings >= requiredMonthlySavings
      : null;

  const deficit =
    requiredMonthlySavings !== null
      ? Math.max(0, requiredMonthlySavings - avgMonthlySavings)
      : null;

  return {
    remaining,
    requiredMonthlySavings,
    monthsAtCurrentPace,
    projectedDate,
    onTrack,
    deficit,
  };
}

// ─── Debt payoff (Snowball + Avalanche) ──────────────────────────────────────

export type DebtInput = {
  id: string;
  name: string;
  balance: number;
  interestRate: number; // anual %
  minPayment: number;
};

export type PayoffPlan = {
  order: Array<{
    id: string;
    name: string;
    balance: number;
    interestRate: number;
    monthsToPayoff: number;
    interestPaid: number;
  }>;
  totalMonths: number;
  totalInterest: number;
};

/**
 * Simulador de payoff. Calcula cuánto tardas y cuánto interés pagas
 * si atacas las deudas en cierto orden, pagando los mínimos en las demás
 * y enviando el extraPayment a la deuda prioritaria. Cuando una se
 * liquida, el pago se redirige a la siguiente ("rollover").
 */
export function simulatePayoff(
  debts: DebtInput[],
  strategy: "snowball" | "avalanche",
  extraPayment: number = 0,
  maxMonths: number = 600
): PayoffPlan {
  const order =
    strategy === "snowball"
      ? [...debts].sort((a, b) => a.balance - b.balance)
      : [...debts].sort((a, b) => b.interestRate - a.interestRate);

  type Working = DebtInput & { accumInterest: number; monthsUsed: number };
  const working: Working[] = order.map((d) => ({
    ...d,
    accumInterest: 0,
    monthsUsed: 0,
  }));

  let month = 0;
  const result: PayoffPlan["order"] = [];

  while (working.some((d) => d.balance > 0) && month < maxMonths) {
    month++;
    // Interés del mes
    for (const d of working) {
      if (d.balance <= 0) continue;
      const monthlyRate = d.interestRate / 100 / 12;
      const interest = d.balance * monthlyRate;
      d.balance += interest;
      d.accumInterest += interest;
    }
    // Pagos mínimos a todas las activas
    let remainingExtra = extraPayment;
    for (const d of working) {
      if (d.balance <= 0) continue;
      const pay = Math.min(d.balance, d.minPayment);
      d.balance -= pay;
    }
    // Extra va a la primera no liquidada según strategy
    for (const d of working) {
      if (d.balance <= 0 || remainingExtra <= 0) continue;
      const pay = Math.min(d.balance, remainingExtra);
      d.balance -= pay;
      remainingExtra -= pay;
      break;
    }
    // Detectar liquidaciones
    for (const d of working) {
      if (d.balance <= 0 && !result.find((r) => r.id === d.id)) {
        result.push({
          id: d.id,
          name: d.name,
          balance: d.balance < 0 ? 0 : d.balance,
          interestRate: d.interestRate,
          monthsToPayoff: month,
          interestPaid: +d.accumInterest.toFixed(2),
        });
      }
    }
  }

  const totalMonths = result.length ? Math.max(...result.map((r) => r.monthsToPayoff)) : 0;
  const totalInterest = result.reduce((s, r) => s + r.interestPaid, 0);

  return { order: result, totalMonths, totalInterest: +totalInterest.toFixed(2) };
}

// ─── FIRE Calculator ────────────────────────────────────────────────────────

export type FIREProjection = {
  /** Monto objetivo para retiro tradicional usando regla del 4%. */
  fireNumber: number;
  /** Años hasta FIRE dado savings rate actual. */
  yearsToFIRE: number | null;
  /** Años hasta Coast FIRE (dejas de aportar). */
  yearsToCoastFIRE: number | null;
  /** Edad estimada al alcanzar FIRE. */
  ageAtFIRE: number | null;
};

/**
 * FIRE basado en la regla del 4%.
 * fireNumber = annualExpenses × 25
 * Assume return real ~7% (inflación ajustada).
 */
export function calculateFIRE(
  monthlyExpenses: number,
  monthlySavings: number,
  currentInvestments: number,
  currentAge: number | null,
  realReturn: number = 0.07
): FIREProjection {
  const annualExpenses = monthlyExpenses * 12;
  const fireNumber = annualExpenses * 25;
  const annualSavings = monthlySavings * 12;

  if (currentInvestments >= fireNumber) {
    return {
      fireNumber,
      yearsToFIRE: 0,
      yearsToCoastFIRE: 0,
      ageAtFIRE: currentAge,
    };
  }

  // Compound interest: FV = PV(1+r)^n + PMT*[((1+r)^n - 1)/r]
  // Solve para n dado FV = fireNumber
  let yearsToFIRE: number | null = null;
  if (annualSavings > 0 || currentInvestments > 0) {
    const r = realReturn;
    // Iterativo: simula año a año
    let balance = currentInvestments;
    let years = 0;
    while (balance < fireNumber && years < 100) {
      balance = balance * (1 + r) + annualSavings;
      years++;
    }
    yearsToFIRE = years;
  }

  // Coast FIRE: cuándo tus investments actuales + crecimiento llegan a FIRE
  // sin aportes adicionales.
  let yearsToCoastFIRE: number | null = null;
  if (currentInvestments > 0) {
    // (1+r)^n * currentInvestments = fireNumber → n = log(fireNumber/current) / log(1+r)
    const needed = fireNumber / currentInvestments;
    if (needed > 1) {
      yearsToCoastFIRE = Math.log(needed) / Math.log(1 + realReturn);
    } else {
      yearsToCoastFIRE = 0;
    }
  }

  const ageAtFIRE = currentAge !== null && yearsToFIRE !== null ? currentAge + yearsToFIRE : null;

  return { fireNumber, yearsToFIRE, yearsToCoastFIRE, ageAtFIRE };
}

// ─── Affordability check ─────────────────────────────────────────────────────

export type AffordabilityCheck = {
  /** Puede pagarlo al contado sin afectar emergency fund (>1m). */
  canAffordCash: boolean;
  /** Nuevo balance si paga al contado. */
  newBalance: number;
  /** Meses de runway después. */
  newRunwayMonths: number;
  /** Si ahorrara para comprarlo, ¿cuánto tiempo? */
  monthsToSaveFor: number | null;
  /** Financiado en N meses → cuota. */
  monthlyInstallment: (months: number) => number;
  /** Impacto en savings rate si lo financia en N meses. */
  savingsRateImpact: (months: number) => number;
};

export function checkAffordability(
  price: number,
  currentLiquid: number,
  avgMonthlyExpense: number,
  monthlySavings: number,
  monthlyIncome: number
): AffordabilityCheck {
  const newBalance = currentLiquid - price;
  const newRunwayMonths = avgMonthlyExpense > 0 ? newBalance / avgMonthlyExpense : 0;
  const canAffordCash = newRunwayMonths >= 1;
  const monthsToSaveFor = monthlySavings > 0 ? price / monthlySavings : null;

  return {
    canAffordCash,
    newBalance,
    newRunwayMonths,
    monthsToSaveFor,
    monthlyInstallment: (months) => price / months,
    savingsRateImpact: (months) => {
      const extraCost = price / months;
      const newSavings = monthlySavings - extraCost;
      return monthlyIncome > 0 ? (newSavings / monthlyIncome) * 100 : 0;
    },
  };
}
