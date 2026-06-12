import NextAuth, { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
  interface JWT {
    id?: string;
    passwordChangedAt?: number;
  }
}
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { CredentialsSignin } from "next-auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { logSecurityEvent } from "@/lib/security-log";
import { logger } from "@/lib/logger";
import { verifyToken, consumeBackupCode } from "@/lib/two-factor";

/**
 * Errores tipados que el frontend del login reconoce (login/page.tsx busca
 * estos `code` en result.error). Extendemos CredentialsSignin para que
 * NextAuth respete el `code` en vez de mapear a "Configuration".
 */
class TwoFactorRequiredError extends CredentialsSignin {
  code = "TwoFactorRequired";
}
class TwoFactorInvalidError extends CredentialsSignin {
  code = "TwoFactorInvalid";
}
class AccountLockedError extends CredentialsSignin {
  code = "AccountLocked";
}

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MINUTES = 30;

const GOOGLE_ENABLED = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

/**
 * Crea (o encuentra) el usuario de la app a partir de un login con Google.
 * Sin adapter de DB: el enlace es por email. Si no existe, crea User +
 * UserProfile + Gamification con los mismos defaults que el registro normal.
 */
async function upsertGoogleUser(
  email: string,
  name: string | null,
  image: string | null,
): Promise<{ id: string } | null> {
  const normEmail = email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({
    where: { email: normEmail },
    select: { id: true },
  });
  if (existing) return existing;

  const created = await prisma.user.create({
    data: {
      email: normEmail,
      name: name ?? null,
      image: image ?? null,
      emailVerified: new Date(), // Google ya verificó el correo
      profile: { create: {} },
      gamification: { create: {} },
    },
    select: { id: true, email: true },
  });
  void logSecurityEvent({
    eventType: "register",
    userId: created.id,
    email: created.email,
    metadata: { via: "google" },
  });
  return { id: created.id };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    ...(GOOGLE_ENABLED
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            authorization: {
              params: { access_type: "offline", prompt: "consent" },
            },
          }),
        ]
      : []),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
        twoFactorToken: { label: "2FA", type: "text" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);
        const twoFactorToken = String(credentials.twoFactorToken ?? "").trim();

        const user = await prisma.user.findUnique({
          where: { email },
        });

        // Caso 1: user no existe → log y fail (mismo mensaje que password incorrecto, evita enumeration)
        if (!user || !user.passwordHash) {
          void logSecurityEvent({
            eventType: "login_failed",
            email,
            metadata: { reason: "user_not_found" },
          });
          return null;
        }

        // Caso 2: cuenta bloqueada por demasiados intentos fallidos
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          void logSecurityEvent({
            eventType: "login_failed",
            userId: user.id,
            email,
            metadata: {
              reason: "account_locked",
              until: user.lockedUntil.toISOString(),
            },
          });
          throw new AccountLockedError();
        }

        // Caso 3: password incorrecto → incrementar contador
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          const failedAttempts = user.failedLoginAttempts + 1;
          const shouldLock = failedAttempts >= LOCKOUT_THRESHOLD;
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: failedAttempts,
              lockedUntil: shouldLock
                ? new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000)
                : null,
            },
          });
          void logSecurityEvent({
            eventType: "login_failed",
            userId: user.id,
            email,
            metadata: {
              reason: "wrong_password",
              failedAttempts,
              locked: shouldLock,
            },
          });
          return null;
        }

        // Caso 3.5: 2FA. Si el usuario lo tiene activado y no envía token,
        // pedirlo. Si lo envía, validarlo (TOTP o backup code). El password
        // ya pasó: si el 2FA falla, NO incrementamos failedLoginAttempts
        // (solo cuenta password) para no bloquear cuentas por un dígito.
        if (user.twoFactorEnabled && user.twoFactorSecret) {
          if (!twoFactorToken) {
            void logSecurityEvent({
              eventType: "login_failed",
              userId: user.id,
              email,
              metadata: { reason: "2fa_required" },
            });
            throw new TwoFactorRequiredError();
          }
          // 6 dígitos → TOTP. Cualquier otra cosa → backup code.
          const isTotp = /^\d{6}$/.test(twoFactorToken);
          let ok = false;
          if (isTotp) {
            ok = verifyToken(twoFactorToken, user.twoFactorSecret);
          } else {
            const result = consumeBackupCode(
              twoFactorToken,
              user.twoFactorBackupCodes,
            );
            if (result.matched) {
              ok = true;
              await prisma.user.update({
                where: { id: user.id },
                data: { twoFactorBackupCodes: result.remaining },
              });
            }
          }
          if (!ok) {
            void logSecurityEvent({
              eventType: "login_failed",
              userId: user.id,
              email,
              metadata: { reason: "2fa_invalid" },
            });
            throw new TwoFactorInvalidError();
          }
        }

        // Caso 4: login exitoso → reset contador + lastLoginAt
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
          },
        });

        void logSecurityEvent({
          eventType: "login_success",
          userId: user.id,
          email,
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      // Google: exigir email verificado. Credentials se valida en authorize().
      if (account?.provider === "google") {
        const p = profile as { email?: string; email_verified?: boolean } | undefined;
        return Boolean(p?.email) && p?.email_verified !== false;
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // Login con Google: enlazar (o crear) el usuario de la app por email.
      if (account?.provider === "google" && user?.email) {
        try {
          const dbUser = await upsertGoogleUser(
            user.email,
            user.name ?? null,
            user.image ?? null,
          );
          if (dbUser) {
            token.id = dbUser.id;
            token.iat = Math.floor(Date.now() / 1000);
          }
        } catch (e) {
          logger.error("auth:google-upsert-failed", {
            error: e instanceof Error ? e.message : String(e),
          });
          // Sin token.id la sesión queda inválida y no se filtra acceso.
        }
        return token;
      }
      if (user) {
        token.id = user.id;
        // Marca el timestamp de emisión del token para invalidación por password change
        token.iat = Math.floor(Date.now() / 1000);
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        // Verificar que el token no sea anterior a un password change
        try {
          const user = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { passwordChangedAt: true },
          });
          if (user?.passwordChangedAt) {
            const changedAtSec = Math.floor(user.passwordChangedAt.getTime() / 1000);
            const issuedAtSec = Number(token.iat ?? 0);
            if (issuedAtSec < changedAtSec) {
              // Token emitido antes del último cambio de password → inválido
              logger.info("auth:session-invalidated-by-password-change", {
                userId: token.id,
              });
              return { ...session, user: { ...session.user, id: "" } };
            }
          }
        } catch {
          // Si falla la DB, dejamos pasar (optimistic) para no bloquear users legítimos
        }
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
