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
});

export type RegisterInput = z.infer<typeof registerSchema>;
