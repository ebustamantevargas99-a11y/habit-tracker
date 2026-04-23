import type { Metadata, Viewport } from "next";
import {
  Inter,
  Playfair_Display,
  Shippori_Mincho,
  JetBrains_Mono,
  Crimson_Pro,
} from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import "./globals.css";

// Fuentes disponibles a nivel global — los temas eligen cuál usar vía
// CSS variables --font-heading / --font-body / --font-mono en globals.css.
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700", "800", "900"],
});

// Serif japonés para temas Zen y Sakura
const shippori = Shippori_Mincho({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-shippori",
  weight: ["400", "500", "600", "700", "800"],
});

// Monospace para temas Matrix y Cyberpunk
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
  weight: ["400", "500", "600", "700"],
});

// Serif editorial ligero para temas elegantes (Sakura italic)
const crimson = Crimson_Pro({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-crimson",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Ultimate TRACKER",
  description:
    "Trackea toda tu vida en una sola app: hábitos, fitness, nutrición, finanzas, wellness y más. Exporta tu contexto a la IA de tu preferencia para análisis.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ultimate TRACKER",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Ultimate TRACKER",
    description: "La única app que necesitas para trackear tu vida.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFDF9" },
    { media: "(prefers-color-scheme: dark)", color: "#1A1411" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} ${shippori.variable} ${jetbrains.variable} ${crimson.variable} font-sans`}
        style={{ backgroundColor: "var(--color-paper)" }}
      >
        <SessionProvider>{children}</SessionProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
