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
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { logSecurityEvent } from "@/lib/security-log";
import { logger } from "@/lib/logger";

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MINUTES = 30;

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);

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
          return null;
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
    jwt({ token, user }) {
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
