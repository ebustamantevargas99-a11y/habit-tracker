import Link from "next/link";
import {
  Sparkles,
  Target,
  Heart,
  Dumbbell,
  Utensils,
  BookOpen,
  Wind,
  Clock,
  Brain,
  Shield,
  Zap,
  ChevronRight,
} from "lucide-react";

export const metadata = {
  title: "Ultimate TRACKER — Trackea toda tu vida en una sola app",
  description:
    "Hábitos, fitness, nutrición, finanzas, meditación, diario, ciclo menstrual, trabajo profundo y más. Exporta todo a tu IA personal (Claude/ChatGPT/Gemini) para análisis. Beta gratuita.",
};

export default function LandingPage() {
  return (
    <div className="bg-brand-paper text-brand-dark min-h-screen">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          <span className="font-display text-xl font-bold">
            Ultimate <span className="tracking-widest">TRACKER</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-brand-medium hover:text-brand-dark"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 rounded-button bg-accent text-white text-sm font-semibold hover:bg-brand-brown"
          >
            Empezar gratis
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <span className="inline-block px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-semibold uppercase tracking-widest mb-6">
          Beta pública · 100% gratis
        </span>
        <h1 className="font-display text-5xl md:text-6xl font-bold text-brand-dark leading-tight mb-6">
          Trackea toda tu vida
          <br />
          <span className="text-accent">en una sola app</span>.
        </h1>
        <p className="text-lg text-brand-warm max-w-2xl mx-auto mb-10 leading-relaxed">
          Hábitos, fitness, nutrición, finanzas, meditación, sueño, diario,
          ciclo menstrual y más. Después <strong className="text-brand-dark">exporta todo
          a tu IA personal</strong> (Claude, ChatGPT, Gemini) y recibe análisis
          profundo — sin que te cobremos un centavo de API.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/login"
            className="px-7 py-3 rounded-button bg-accent text-white text-base font-semibold hover:bg-brand-brown flex items-center gap-2"
          >
            Crear mi cuenta <ChevronRight size={16} />
          </Link>
          <a
            href="#features"
            className="px-7 py-3 rounded-button border border-brand-cream text-brand-dark text-base font-semibold hover:bg-brand-cream"
          >
            Ver funciones
          </a>
        </div>
        <p className="text-xs text-brand-tan mt-6">
          Sin tarjeta de crédito · Sin suscripción · Sin ads
        </p>
      </section>

      {/* Diferenciador IA */}
      <section className="bg-gradient-to-br from-brand-dark to-brand-brown text-brand-paper py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-start gap-6 flex-wrap md:flex-nowrap">
            <div className="shrink-0 w-16 h-16 bg-accent-glow rounded-2xl flex items-center justify-center">
              <Sparkles size={28} className="text-brand-dark" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-brand-light-tan mb-2">
                Función única en el mercado
              </p>
              <h2 className="font-display text-3xl font-bold text-accent-glow mb-4">
                Tu data, tu IA. Sin costos extra.
              </h2>
              <p className="text-base text-brand-light-cream leading-relaxed mb-4">
                Cada módulo tiene un botón <strong>&ldquo;Analizar con IA&rdquo;</strong> que
                genera un prompt ultra-contextual con tu data real. Lo copias,
                lo pegas en tu Claude/ChatGPT/Gemini personal y obtienes
                análisis de experto.
              </p>
              <p className="text-sm text-brand-light-cream">
                Nosotros no pagamos ni vendemos tu data. Nunca.
                Tú usas tu suscripción existente de IA como quieras.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-3">
          Todo en un solo lugar
        </h2>
        <p className="text-center text-brand-warm mb-12 max-w-2xl mx-auto">
          Activas solo los módulos que usas. Los demás quedan ocultos.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <FeatureCard
            icon={<Target />}
            title="Hábitos + Rachas"
            description="Check diario, racha con confeti en hitos (7/30/100/365 días), cálculo de fortaleza."
          />
          <FeatureCard
            icon={<Dumbbell />}
            title="Fitness Pro"
            description="Registro de entrenamientos con RPE, superserie, descanso automático, 1RM estimado, volumen por músculo, MEV/MAV/MRV."
          />
          <FeatureCard
            icon={<Utensils />}
            title="Nutrición pro"
            description="100+ alimentos base, anillos de macros, hidratación con un toque, copiar día anterior, búsqueda por 12 categorías."
          />
          <FeatureCard
            icon={<Heart />}
            title="Ánimo + Sueño"
            description="Registro diario con factores, gráficas, correlación con entrenos y nutrición."
          />
          <FeatureCard
            icon={<Clock />}
            title="Ayuno + Trabajo profundo"
            description="Temporizador en vivo de ayuno intermitente (16:8/18:6/OMAD). Bloques de 90 min de foco con rating."
          />
          <FeatureCard
            icon={<Wind />}
            title="Meditación"
            description="Temporizador circular con respiración, aviso sonoro al terminar. Registro de sesiones con tipo y duración."
          />
          <FeatureCard
            icon={<BookOpen />}
            title="Lectura"
            description="Biblioteca con progreso, sesiones de lectura, calificación 5★, finalización automática al llegar al total."
          />
          <FeatureCard
            icon={<Brain />}
            title="Puntuación de Vida 0-100"
            description="Puntuación multi-dimensión agregada (hábitos + fitness + nutrición + productividad). Gráfica de 30 días."
          />
          <FeatureCard
            icon={<Target />}
            title="Finanzas + OKR"
            description="Seguimiento de presupuesto, suscripciones, objetivos + resultados clave con proyecciones a 12 meses."
          />
          <FeatureCard
            icon={<Shield />}
            title="Seguridad real"
            description="2FA TOTP, verificación de contraseña en HIBP, bloqueo de cuenta, registro de auditoría, exportación y eliminación de cuenta (GDPR)."
          />
          <FeatureCard
            icon={<Zap />}
            title="Ciclo menstrual"
            description="Predicción del próximo período, ventana fértil, síntomas correlacionados con ánimo y energía."
          />
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-brand-warm-white py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Empieza hoy. Tarda 30 segundos.
          </h2>
          <p className="text-brand-warm mb-8 max-w-2xl mx-auto">
            El onboarding te pregunta 5 cosas para activar solo los módulos que
            te interesan. El resto queda oculto.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-button bg-accent text-white text-base font-semibold hover:bg-brand-brown"
          >
            Crear mi cuenta gratis <ChevronRight size={16} />
          </Link>
          <p className="text-xs text-brand-tan mt-6">
            Al registrarte aceptas los{" "}
            <Link href="/terms" className="underline">
              términos
            </Link>{" "}
            y la{" "}
            <Link href="/privacy" className="underline">
              política de privacidad
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-brand-cream py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-brand-tan">
            © 2026 Ultimate TRACKER · Hecho con ♥ · Beta pública gratuita
          </p>
          <div className="flex items-center gap-5 text-xs text-brand-warm">
            <Link href="/terms" className="hover:text-brand-dark">
              Términos
            </Link>
            <Link href="/privacy" className="hover:text-brand-dark">
              Privacidad
            </Link>
            <Link href="/cookies" className="hover:text-brand-dark">
              Cookies
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-brand-paper border border-brand-cream rounded-2xl p-5 hover:border-accent/50 hover:shadow-warm transition">
      <div className="w-10 h-10 bg-accent/10 text-accent rounded-xl flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="font-serif text-lg font-semibold text-brand-dark mb-1">
        {title}
      </h3>
      <p className="text-sm text-brand-warm leading-relaxed">{description}</p>
    </div>
  );
}
