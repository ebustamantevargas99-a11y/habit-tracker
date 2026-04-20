import { z } from "zod";

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato esperado YYYY-MM-DD");

export const monthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, "Formato esperado YYYY-MM");

export const idSchema = z.string().min(1).max(64);

export const nonNegativeNumber = z
  .number()
  .finite()
  .nonnegative()
  .max(1_000_000_000);

export const positiveNumber = z
  .number()
  .finite()
  .positive()
  .max(1_000_000_000);
