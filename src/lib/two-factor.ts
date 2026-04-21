import { authenticator } from "otplib";
import QRCode from "qrcode";
import { createHash, randomBytes } from "crypto";

authenticator.options = {
  step: 30,
  window: 1, // acepta códigos del paso actual + uno anterior/siguiente (tolerancia de reloj)
  digits: 6,
};

const ISSUER = "Ultimate TRACKER";

export function generateSecret(): string {
  return authenticator.generateSecret();
}

export function buildOtpAuthUrl(email: string, secret: string): string {
  return authenticator.keyuri(email, ISSUER, secret);
}

export async function generateQRCodeDataUrl(email: string, secret: string): Promise<string> {
  const url = buildOtpAuthUrl(email, secret);
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 260,
  });
}

export function verifyToken(token: string, secret: string): boolean {
  if (!/^\d{6}$/.test(token.replace(/\s/g, ""))) return false;
  try {
    return authenticator.verify({ token: token.replace(/\s/g, ""), secret });
  } catch {
    return false;
  }
}

/**
 * Genera 10 códigos de respaldo. Guardamos solo los hashes; el user los descarga
 * una vez y los guarda en sitio seguro.
 * Formato humano-legible: XXXX-XXXX (8 chars hex, separador visual).
 */
export function generateBackupCodes(count = 10): { plain: string[]; hashes: string[] } {
  const plain: string[] = [];
  const hashes: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = randomBytes(4).toString("hex").toUpperCase();
    const formatted = `${raw.slice(0, 4)}-${raw.slice(4)}`;
    plain.push(formatted);
    hashes.push(hashBackupCode(formatted));
  }
  return { plain, hashes };
}

export function hashBackupCode(code: string): string {
  return createHash("sha256")
    .update(code.toUpperCase().replace(/[^0-9A-F]/g, ""))
    .digest("hex");
}

/**
 * Intenta consumir un backup code. Retorna nuevo array sin el código usado
 * o null si no matchea.
 */
export function consumeBackupCode(
  code: string,
  hashes: string[]
): { remaining: string[]; matched: boolean } {
  const h = hashBackupCode(code);
  const idx = hashes.indexOf(h);
  if (idx === -1) return { remaining: hashes, matched: false };
  const remaining = [...hashes.slice(0, idx), ...hashes.slice(idx + 1)];
  return { remaining, matched: true };
}
