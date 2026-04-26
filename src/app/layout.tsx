import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { appBaseUrl } from "@/lib/app-url";
import "./globals.css";

// Fuentes disponibles a nivel global — los temas eligen cuál usar vía
// CSS vars --font-heading / --font-body / --font-mono en globals.css.
// Los 8 temas neutros elegantes (2.2) usan solo Playfair + Inter; JetBrains
// Mono se mantiene para números/métricas en todos los temas.
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

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
  weight: ["400", "500", "600", "700"],
});

// metadataBase es requerida por Next 14 para resolver URLs absolutas en
// Open Graph, canonical, y manifest. Se evalúa en build time + en cada
// request server-side. Resuelve desde NEXT_PUBLIC_APP_URL → NEXTAUTH_URL
// → VERCEL_URL → fallback histórico (ver src/lib/app-url.ts).
export const metadata: Metadata = {
  metadataBase: new URL(appBaseUrl()),
  title: {
    default: "Ultimate TRACKER",
    template: "%s · Ultimate TRACKER",
  },
  description:
    "Trackea toda tu vida en una sola app: hábitos, fitness, nutrición, finanzas, wellness y más. Exporta tu contexto a la IA de tu preferencia para análisis.",
  applicationName: "Ultimate TRACKER",
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
    locale: "es_MX",
    siteName: "Ultimate TRACKER",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ultimate TRACKER",
    description: "La única app que necesitas para trackear tu vida.",
  },
  // Indica a buscadores y stores que la app es legítima.
  robots: {
    index: true,
    follow: true,
  },
  // Categoría que algunas tiendas (Microsoft Store, Web App stores) leen.
  category: "lifestyle",
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
        className={`${inter.variable} ${playfair.variable} ${jetbrains.variable} font-sans`}
        style={{ backgroundColor: "var(--color-paper)" }}
      >
        <SessionProvider>{children}</SessionProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
