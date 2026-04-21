import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(100).optional().nullable(),
  email: z.string().email("Email inválido").max(255).toLowerCase(),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(100, "La contraseña es demasiado larga")
    .regex(/[a-z]/, "Debe incluir al menos una minúscula")
    .regex(/[A-Z]/, "Debe incluir al menos una mayúscula")
    .regex(/[0-9]/, "Debe incluir al menos un número"),
  // Honeypot anti-bot: campo oculto. Si viene populado = bot.
  website: z.string().max(0).optional().or(z.literal("")),
  // Tiempo que tardó en llenar el form (ms). Menos de 1500 = bot.
  formFilledIn: z.number().int().min(0).max(1_000_000).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
