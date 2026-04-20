import { z } from "zod";
import { dateSchema, monthSchema, positiveNumber } from "./common";

const category = z.string().trim().min(1).max(100);
const description = z.string().trim().min(1).max(500);
const name = z.string().trim().min(1).max(200);

export const budgetCreateSchema = z.object({
  category,
  limit: positiveNumber,
  month: monthSchema.optional(),
});

export const budgetUpdateSchema = z.object({
  limit: positiveNumber,
});

export const transactionCreateSchema = z.object({
  date: dateSchema,
  description,
  amount: positiveNumber,
  type: z.enum(["income", "expense"]),
  category,
  subcategory: z.string().trim().max(100).optional().nullable(),
  paymentMethod: z.string().trim().max(100).optional().nullable(),
  isRecurring: z.boolean().optional(),
});

export const transactionUpdateSchema = transactionCreateSchema.partial();

export const billCreateSchema = z.object({
  name,
  amount: positiveNumber,
  dueDate: dateSchema,
  isPaid: z.boolean().optional(),
  isRecurring: z.boolean().optional(),
});

export const billUpdateSchema = billCreateSchema.partial();

export const subscriptionCreateSchema = z.object({
  name,
  amount: positiveNumber,
  billingCycle: z.enum(["monthly", "yearly", "weekly", "quarterly"]),
  nextBilling: dateSchema,
  category: category.optional().nullable(),
  isActive: z.boolean().optional(),
});

export const subscriptionUpdateSchema = subscriptionCreateSchema.partial();

export const wishlistCreateSchema = z.object({
  name,
  price: positiveNumber,
  priority: z.enum(["low", "medium", "high"]).optional(),
  category: category.optional().nullable(),
  url: z.string().url().max(2000).optional().nullable(),
  isPurchased: z.boolean().optional(),
});

export const wishlistUpdateSchema = wishlistCreateSchema.partial();
