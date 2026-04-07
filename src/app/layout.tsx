import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Ultimate Habit Tracker",
  description: "Track your habits, build better routines, and achieve your goals with visual insights and comprehensive dashboards.",
  icons: {
    icon: "🎯",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body
        className={`${inter.variable} font-sans`}
        style={{ backgroundColor: "var(--color-paper)" }}
      >
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
