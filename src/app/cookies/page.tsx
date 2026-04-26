import type { Metadata } from "next";
import LegalLayout from "@/components/features/legal/legal-layout";

export const metadata: Metadata = {
  title: "Política de Cookies — Ultimate TRACKER",
  description:
    "Qué cookies y almacenamiento local usa Ultimate TRACKER y cómo gestionarlos.",
};

export default function CookiesPage() {
  return (
    <LegalLayout
      title="Política de Cookies"
      intro="Solo usamos las cookies estrictamente necesarias para que el Servicio funcione."
      lastUpdated="25 de abril de 2026"
    >
      <h2>1. Qué son las cookies</h2>
      <p>
        Las cookies son pequeños archivos de texto que un sitio web guarda
        en tu dispositivo cuando lo visitas. Se usan para recordar
        información (como sesiones iniciadas) entre páginas y visitas.
      </p>
      <p>
        Ultimate TRACKER usa el mínimo absoluto de cookies y almacenamiento
        local necesario para funcionar. <strong>No usamos cookies de
        terceros con fines publicitarios ni de tracking cross-site.</strong>
      </p>

      <h2>2. Cookies que usamos</h2>

      <h3>2.1 Estrictamente necesarias (no requieren consentimiento)</h3>
      <ul>
        <li>
          <strong><code>__Secure-authjs.session-token</code></strong> /{" "}
          <strong><code>authjs.session-token</code></strong> — cookie de
          sesión de NextAuth. Mantiene tu sesión iniciada. Es{" "}
          <code>httpOnly</code> y <code>secure</code> en producción.
          Caduca al cerrar sesión o tras 30 días de inactividad.
        </li>
        <li>
          <strong><code>__Secure-authjs.callback-url</code></strong> —
          cookie temporal usada durante el login para redirigirte de
          vuelta a donde estabas. Se borra después.
        </li>
        <li>
          <strong><code>__Host-authjs.csrf-token</code></strong> — token
          anti-CSRF para proteger formularios de autenticación.
        </li>
      </ul>

      <h3>2.2 Almacenamiento local (LocalStorage / IndexedDB)</h3>
      <p>
        Además de cookies, guardamos algunos valores de configuración en
        el almacenamiento local de tu navegador para mejorar tu
        experiencia:
      </p>
      <ul>
        <li>
          <strong><code>app-theme</code></strong> — tema visual elegido
          (Pergamino, Marfil, Café, etc.). Lo replicamos también en
          servidor para que viaje entre dispositivos.
        </li>
        <li>
          <strong><code>ut-notified-events</code></strong> — IDs de
          eventos de calendario para los que ya disparamos un
          recordatorio, evitando notificaciones duplicadas.
        </li>
        <li>
          <strong><code>ut-home-v2</code></strong> — preferencia para
          activar el dashboard nuevo (Home v2) durante la beta.
        </li>
      </ul>

      <h3>2.3 Cookies de terceros</h3>
      <p>
        El Servicio se aloja en Vercel, que puede establecer cookies
        técnicas necesarias para balanceo de carga (<code>__vcl</code>) y
        métricas operativas anonimizadas. Estas no contienen información
        personal identificable.
      </p>

      <h2>3. Cookies analíticas o publicitarias</h2>
      <p>
        <strong>No usamos</strong> cookies de Google Analytics, Meta
        Pixel, ni redes publicitarias. Si en el futuro agregamos
        analítica, será mediante un proveedor que respete la privacidad
        (PostHog self-host o similar) y solo si das tu consentimiento
        explícito.
      </p>

      <h2>4. Cómo gestionar las cookies</h2>
      <p>
        Puedes bloquear o eliminar cookies desde la configuración de tu
        navegador. Ten en cuenta que si bloqueas las cookies de sesión, no
        podrás iniciar sesión en el Servicio.
      </p>
      <ul>
        <li>
          <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Chrome</a>
        </li>
        <li>
          <a href="https://support.mozilla.org/es/kb/Borrar%20cookies" target="_blank" rel="noopener noreferrer">Firefox</a>
        </li>
        <li>
          <a href="https://support.apple.com/es-mx/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a>
        </li>
        <li>
          <a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">Edge</a>
        </li>
      </ul>

      <h2>5. Cambios en esta política</h2>
      <p>
        Si cambiamos las cookies que usamos o sus finalidades,
        actualizaremos esta página y avisaremos en la app. La fecha de
        última actualización está al inicio.
      </p>

      <h2>6. Contacto</h2>
      <p>
        Si tienes preguntas sobre esta política, escríbenos a{" "}
        <a href="mailto:privacy@ultimatetracker.app">privacy@ultimatetracker.app</a>.
      </p>
    </LegalLayout>
  );
}
