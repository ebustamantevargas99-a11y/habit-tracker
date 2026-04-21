import { z } from "zod";
import { dateSchema } from "./common";

const money = z.number().min(-1_000_000_000).max(1_000_000_000);
const positiveMoney = z.number().min(0).max(1_000_000_000);
const currency = z.string().regex(/^[A-Z]{3}$/, "Moneda ISO 4217");

// ─── Accounts ────────────────────────────────────────────────────────────────

const accountTypeEnum = z.enum([
  "checking",
  "savings",
  "credit",
  "investment",
  "loan",
  "crypto",
  "cash",
]);

export const accountCreateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  type: accountTypeEnum,
  currency: currency.optional(),
  balance: money.optional(),
  creditLimit: positiveMoney.optional().nullable(),
  interestRate: z.number().min(0).max(100).optional().nullable(),
  institution: z.string().trim().max(100).optional().nullable(),
  color: z.string().trim().max(20).optional().nullable(),
  icon: z.string().trim().max(10).optional().nullable(),
});

export const accountUpdateSchema = accountCreateSchema.partial().extend({
  archived: z.boolean().optional(),
});

// ─── Transactions ────────────────────────────────────────────────────────────

const txnTypeEnum = z.enum(["income", "expense", "transfer"]);

export const transactionCreateSchema = z.object({
  accountId: z.string().min(1).max(64),
  date: dateSchema.optional(),
  amount: positiveMoney,
  type: txnTypeEnum,
  category: z.string().trim().min(1).max(100),
  subcategory: z.string().trim().max(100).optional().nullable(),
  merchant: z.string().trim().max(200).optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  tags: z.array(z.string().trim().max(50)).max(20).optional(),
  photoData: z.string().max(3_000_000).optional().nullable(),
  transferToAccountId: z.string().min(1).max(64).optional().nullable(),
});

export const transactionUpdateSchema = transactionCreateSchema.partial();

// ─── Recurring ──────────────────────────────────────────────────────────────

const freqEnum = z.enum(["weekly", "biweekly", "monthly", "quarterly", "annual"]);

export const recurringCreateSchema = z.object({
  accountId: z.string().min(1).max(64),
  name: z.string().trim().min(1).max(200),
  amount: positiveMoney,
  type: z.enum(["income", "expense"]),
  category: z.string().trim().min(1).max(100),
  subcategory: z.string().trim().max(100).optional().nullable(),
  merchant: z.string().trim().max(200).optional().nullable(),
  frequency: freqEnum,
  dayOfMonth: z.number().int().min(1).max(31).optional().nullable(),
  nextDate: dateSchema,
  endDate: dateSchema.optional().nullable(),
  active: z.boolean().optional(),
  autoLog: z.boolean().optional(),
});

export const recurringUpdateSchema = recurringCreateSchema.partial();

// ─── Savings Goals ──────────────────────────────────────────────────────────

export const savingsGoalCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  emoji: z.string().max(10).optional().nullable(),
  targetAmount: positiveMoney,
  currentAmount: positiveMoney.optional(),
  targetDate: dateSchema.optional().nullable(),
  priority: z.enum(["low", "medium", "high"]).optional().nullable(),
  linkedAccountId: z.string().min(1).max(64).optional().nullable(),
  category: z.string().trim().max(50).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const savingsGoalUpdateSchema = savingsGoalCreateSchema.partial().extend({
  achieved: z.boolean().optional(),
});

// ─── Debts ──────────────────────────────────────────────────────────────────

export const debtCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  type: z.enum(["credit_card", "loan", "mortgage", "student", "personal", "other"]),
  balance: positiveMoney,
  originalAmount: positiveMoney.optional().nullable(),
  interestRate: z.number().min(0).max(100),
  minPayment: positiveMoney,
  dueDay: z.number().int().min(1).max(31).optional().nullable(),
  linkedAccountId: z.string().min(1).max(64).optional().nullable(),
});

export const debtUpdateSchema = debtCreateSchema.partial().extend({
  active: z.boolean().optional(),
});

// ─── Investments ────────────────────────────────────────────────────────────

export const investmentCreateSchema = z.object({
  symbol: z.string().trim().min(1).max(20).toUpperCase(),
  name: z.string().trim().min(1).max(200),
  type: z.enum(["crypto", "stock", "etf", "bond", "real_estate", "other"]),
  quantity: z.number().min(0).max(1_000_000_000),
  averageCost: z.number().min(0).max(1_000_000_000),
  currency: currency.optional(),
  linkedAccountId: z.string().min(1).max(64).optional().nullable(),
  lastPrice: z.number().min(0).max(1_000_000_000).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const investmentUpdateSchema = investmentCreateSchema.partial();

// ─── Budget ─────────────────────────────────────────────────────────────────

export const budgetUpsertSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Formato YYYY-MM"),
  category: z.string().trim().min(1).max(100),
  limit: positiveMoney,
});

export const budgetUpdateSchema = z.object({
  limit: positiveMoney,
});
