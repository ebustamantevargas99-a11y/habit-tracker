import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import {
  generateSecret,
  generateQRCodeDataUrl,
} from "@/lib/two-factor";
import { checkRateLimit, rateLimits } from "@/lib/rate-limit";

// POST /api/user/2fa/setup
// Genera un secret TEMPORAL (aún no activa 2FA) y devuelve el QR.
// El usuario debe confirmar con /api/user/2fa/enable pasando un código válido.
export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, rateLimits.passwordReset);
  if (limited) return limited;

  return withAuth(async (userId) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, twoFactorEnabled: true },
    });
    if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    if (user.twoFactorEnabled) {
      return NextResponse.json(
        { error: "2FA ya está activado. Desactívalo primero para regenerar." },
        { status: 400 }
      );
    }

    const secret = generateSecret();

    // Guardamos el secret pero twoFactorEnabled sigue false.
    // Se activa sólo al llamar /enable con un código válido.
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    const qrCode = await generateQRCodeDataUrl(user.email, secret);

    return NextResponse.json({
      secret,   // se muestra como "código manual" en la UI (si no puede escanear QR)
      qrCode,   // data URL listo para <img src={...} />
    });
  });
}
