import { createHash } from "crypto";
import { logger } from "./logger";

/**
 * Verifica si un password está en la DB de Have I Been Pwned usando k-anonymity.
 * No enviamos el password completo, solo los primeros 5 chars del hash SHA1.
 * HIBP responde con todos los hashes que empiezan así, y nosotros matcheamos
 * localmente. El servidor HIBP nunca sabe cuál password probamos.
 *
 * Retorna:
 *  - { breached: true, count: N }  → aparece en N breaches
 *  - { breached: false }           → no aparece
 *  - { breached: null }            → no se pudo verificar (network fail)
 */
export async function checkPwnedPassword(
  password: string
): Promise<{ breached: boolean | null; count?: number }> {
  try {
    const hash = createHash("sha1")
      .update(password, "utf8")
      .digest("hex")
      .toUpperCase();
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const res = await fetch(
      `https://api.pwnedpasswords.com/range/${prefix}`,
      {
        headers: { "Add-Padding": "true" },
        signal: AbortSignal.timeout(3000),
      }
    );

    if (!res.ok) {
      logger.warn("hibp:bad-response", { status: res.status });
      return { breached: null };
    }

    const body = await res.text();
    for (const line of body.split("\n")) {
      const [hashSuffix, countStr] = line.split(":");
      if (hashSuffix?.trim().toUpperCase() === suffix) {
        const count = parseInt(countStr ?? "0", 10);
        return { breached: count > 0, count };
      }
    }
    return { breached: false };
  } catch (e) {
    logger.warn("hibp:exception", {
      error: e instanceof Error ? e.message : "unknown",
    });
    return { breached: null };
  }
}

/**
 * Score de fortaleza 0-4. Usa criterios básicos sin depender de librerías
 * pesadas (zxcvbn bundle es grande). Es menos preciso pero suficiente.
 */
export function passwordStrength(password: string): {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  suggestions: string[];
} {
  const suggestions: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else suggestions.push("Usa al menos 8 caracteres.");

  if (password.length >= 12) score++;

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);
  const variety = [hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length;

  if (variety >= 3) score++;
  if (variety === 4) score++;

  if (!hasUpper) suggestions.push("Añade al menos una mayúscula.");
  if (!hasNumber) suggestions.push("Añade al menos un número.");
  if (!hasSymbol) suggestions.push("Añade un símbolo (!@#$...).");

  // Penalizaciones
  if (/^[a-z]+$/.test(password) || /^[0-9]+$/.test(password)) {
    score = Math.max(0, score - 2) as 0 | 1 | 2 | 3 | 4;
    suggestions.push("Evita passwords con solo letras o solo números.");
  }

  const commonPatterns = ["123456", "password", "qwerty", "admin", "111111"];
  if (commonPatterns.some((p) => password.toLowerCase().includes(p))) {
    score = 0;
    suggestions.push("Tu password contiene patrones muy comunes. Cambia.");
  }

  const labels: Record<number, string> = {
    0: "Muy débil",
    1: "Débil",
    2: "Aceptable",
    3: "Fuerte",
    4: "Muy fuerte",
  };

  return {
    score: Math.min(4, Math.max(0, score)) as 0 | 1 | 2 | 3 | 4,
    label: labels[score] ?? "Desconocido",
    suggestions,
  };
}
