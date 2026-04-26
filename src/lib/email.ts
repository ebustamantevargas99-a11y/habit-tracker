import { logger } from "./logger";
import { appBaseUrl } from "./app-url";

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM ?? "Ultimate TRACKER <noreply@ultimatetracker.app>";
// Resuelto al render (no en module load) para que un cambio de env
// var en runtime se respete y para que tests puedan stubear.
function APP_URL(): string {
  return appBaseUrl();
}

export async function sendEmail(params: SendEmailParams): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    logger.warn("email:no-api-key", {
      to: params.to,
      subject: params.subject,
      note: "RESEND_API_KEY no configurado. Email NO enviado. Mostrando en logs.",
    });
    logger.info("email:dry-run", { to: params.to, subject: params.subject, html: params.html.slice(0, 200) });
    return { ok: false, error: "email_provider_not_configured" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "unknown");
      logger.error("email:resend-error", { status: res.status, error: err.slice(0, 300) });
      return { ok: false, error: `resend_${res.status}` };
    }

    logger.info("email:sent", { to: params.to, subject: params.subject });
    return { ok: true };
  } catch (e) {
    logger.error("email:exception", { error: e instanceof Error ? e.message : "unknown" });
    return { ok: false, error: "network_error" };
  }
}

// ─── Templates ───────────────────────────────────────────────────────────────

export function passwordResetEmail(name: string | null, resetUrl: string): SendEmailParams {
  const safeName = name ?? "usuario";
  return {
    to: "",
    subject: "Restablecer tu contraseña — Ultimate TRACKER",
    html: layout(`
      <h1 style="margin:0 0 16px;font-family:Georgia,serif;color:#3D2B1F;">Restablecer contraseña</h1>
      <p>Hola ${escapeHtml(safeName)},</p>
      <p>Recibimos una solicitud para restablecer tu contraseña en Ultimate TRACKER.</p>
      <p style="margin:24px 0;">
        <a href="${resetUrl}" style="background:#B8860B;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
          Restablecer contraseña
        </a>
      </p>
      <p style="color:#8B6542;font-size:13px;">Este enlace caduca en <strong>1 hora</strong>. Si no solicitaste esto, ignora este correo.</p>
      <p style="color:#8B6542;font-size:13px;">Si el botón no funciona, copia esta URL: <br><code style="word-break:break-all;">${resetUrl}</code></p>
    `),
    text: `Restablecer contraseña: ${resetUrl} (caduca en 1 hora)`,
  };
}

export function emailVerificationEmail(name: string | null, verifyUrl: string): SendEmailParams {
  const safeName = name ?? "usuario";
  return {
    to: "",
    subject: "Confirma tu email — Ultimate TRACKER",
    html: layout(`
      <h1 style="margin:0 0 16px;font-family:Georgia,serif;color:#3D2B1F;">Confirma tu email</h1>
      <p>Hola ${escapeHtml(safeName)}, bienvenido a <strong>Ultimate TRACKER</strong>.</p>
      <p>Confirma tu email para activar tu cuenta:</p>
      <p style="margin:24px 0;">
        <a href="${verifyUrl}" style="background:#B8860B;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
          Confirmar email
        </a>
      </p>
      <p style="color:#8B6542;font-size:13px;">Este enlace caduca en <strong>24 horas</strong>.</p>
    `),
    text: `Confirma tu email: ${verifyUrl} (caduca en 24 horas)`,
  };
}

export function securityAlertEmail(name: string | null, event: string, ipAddress?: string): SendEmailParams {
  const safeName = name ?? "usuario";
  return {
    to: "",
    subject: `Actividad en tu cuenta — ${event}`,
    html: layout(`
      <h1 style="margin:0 0 16px;font-family:Georgia,serif;color:#3D2B1F;">Actividad reciente</h1>
      <p>Hola ${escapeHtml(safeName)},</p>
      <p>Detectamos esta actividad en tu cuenta:</p>
      <p style="background:#F5EDE3;padding:12px;border-radius:8px;"><strong>${escapeHtml(event)}</strong>${ipAddress ? `<br><span style="color:#8B6542;font-size:13px;">desde IP ${escapeHtml(ipAddress)}</span>` : ""}</p>
      <p>Si no fuiste tú, <a href="${APP_URL()}/forgot-password">restablece tu contraseña inmediatamente</a>.</p>
    `),
    text: `${event}${ipAddress ? ` (IP ${ipAddress})` : ""}`,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function layout(content: string): string {
  return `<!doctype html>
<html><body style="margin:0;padding:32px 16px;background:#FFFDF9;font-family:Inter,system-ui,sans-serif;color:#3D2B1F;">
  <div style="max-width:500px;margin:0 auto;background:#fff;padding:32px;border-radius:16px;border:1px solid #EDE0D4;">
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-family:Georgia,serif;font-size:24px;font-weight:700;color:#3D2B1F;">Ultimate <span style="letter-spacing:0.08em;">TRACKER</span></span>
    </div>
    ${content}
    <hr style="margin:32px 0;border:0;border-top:1px solid #EDE0D4;">
    <p style="color:#A0845C;font-size:12px;text-align:center;">
      Ultimate TRACKER · <a href="${APP_URL()}" style="color:#B8860B;">${APP_URL().replace(/https?:\/\//, "")}</a>
    </p>
  </div>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Re-export para mantener compat con call-sites existentes que importan
// `appUrl` desde "@/lib/email". El helper canónico vive en
// "@/lib/app-url" (preferido para nuevos imports).
export { appUrl } from "./app-url";
