import type { Metadata } from "next";
import LegalLayout from "@/components/features/legal/legal-layout";

export const metadata: Metadata = {
  title: "Política de Privacidad — Ultimate TRACKER",
  description:
    "Cómo recolectamos, usamos y protegemos tus datos personales en Ultimate TRACKER.",
};

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Política de Privacidad"
      intro="Tu data es tuya. No la vendemos, no entrenamos modelos con ella, y puedes borrarla cuando quieras."
      lastUpdated="25 de abril de 2026"
    >
      <h2>1. Quiénes somos</h2>
      <p>
        Ultimate TRACKER (&ldquo;el Servicio&rdquo;) es una aplicación
        personal de seguimiento de hábitos, fitness, nutrición, finanzas,
        productividad y bienestar. Esta política explica qué datos
        recolectamos cuando usas el Servicio, por qué los recolectamos, y
        qué derechos tienes sobre ellos.
      </p>
      <p>
        El responsable del tratamiento es el equipo de Ultimate TRACKER.
        Para cualquier pregunta sobre privacidad, contacta a{" "}
        <a href="mailto:privacy@ultimatetracker.app">privacy@ultimatetracker.app</a>.
      </p>

      <h2>2. Qué datos recolectamos</h2>

      <h3>2.1 Datos de cuenta</h3>
      <ul>
        <li><strong>Email</strong> — para iniciar sesión y enviar avisos importantes (verificación, restablecimiento de contraseña).</li>
        <li><strong>Nombre</strong> (opcional) — para personalizar la app.</li>
        <li><strong>Contraseña</strong> — almacenada como hash <code>bcrypt</code> con 13 rondas. Nunca vemos tu contraseña en texto plano.</li>
      </ul>

      <h3>2.2 Datos que tú registras voluntariamente</h3>
      <ul>
        <li><strong>Hábitos:</strong> nombres, frecuencia, completitud diaria.</li>
        <li><strong>Fitness:</strong> entrenos (ejercicios, series, repeticiones, peso, RPE), métricas corporales (peso, % grasa, medidas), récords personales.</li>
        <li><strong>Nutrición:</strong> comidas registradas, alimentos, calorías, macronutrientes, hidratación, marcadores sanguíneos.</li>
        <li><strong>Finanzas:</strong> cuentas, transacciones, presupuestos, metas de ahorro, deudas.</li>
        <li><strong>Productividad:</strong> proyectos, tareas, sesiones de focus.</li>
        <li><strong>Calendario:</strong> eventos, planes diarios, time blocks.</li>
        <li><strong>Lectura:</strong> libros, sesiones, notas.</li>
        <li><strong>Ciclo menstrual</strong> (si lo activas): fechas, síntomas, intensidad.</li>
        <li><strong>Notas y reflexiones</strong> que escribas en el diario.</li>
      </ul>

      <h3>2.3 Datos técnicos</h3>
      <ul>
        <li><strong>Dirección IP</strong> — para rate limiting (anti-abuso) y registro de eventos de seguridad. Se almacena en logs por hasta 90 días.</li>
        <li><strong>User agent</strong> (navegador / sistema operativo).</li>
        <li><strong>Timestamps</strong> de creación, modificación y último acceso.</li>
      </ul>

      <h2>3. Para qué usamos tus datos</h2>
      <ul>
        <li><strong>Operar el Servicio:</strong> mostrarte tus datos, calcular streaks, generar gráficas, etc.</li>
        <li><strong>Seguridad:</strong> detectar accesos no autorizados, prevenir abuso.</li>
        <li><strong>Comunicación necesaria:</strong> verificación de email, restablecimiento de contraseña, alertas de seguridad.</li>
      </ul>
      <p>
        <strong>No</strong> usamos tus datos para publicidad, perfilado de
        terceros, ni entrenamiento de modelos de IA. <strong>No</strong>{" "}
        vendemos, alquilamos ni compartimos tus datos con terceros con
        fines comerciales.
      </p>

      <h2>4. Función &ldquo;Exportar a IA&rdquo;</h2>
      <p>
        El Servicio incluye una función para copiar al portapapeles un
        resumen de tu actividad y enviarlo manualmente a un asistente de
        IA externo (Claude, ChatGPT, Gemini, etc.). Esta acción la inicia
        siempre el usuario; nosotros{" "}
        <strong>no enviamos nada a esos servicios automáticamente</strong>.
        Lo que hagas con el contenido copiado, una vez fuera de Ultimate
        TRACKER, queda sujeto a la política de privacidad del proveedor
        que elijas.
      </p>

      <h2>5. Subprocesadores</h2>
      <p>
        Para operar el Servicio confiamos en proveedores externos sujetos
        a sus propias políticas de privacidad:
      </p>
      <ul>
        <li><strong>Vercel Inc.</strong> — hosting de la aplicación web.</li>
        <li><strong>Neon (Databricks)</strong> — base de datos PostgreSQL.</li>
        <li><strong>Resend</strong> — entrega de emails transaccionales.</li>
        <li><strong>Sentry</strong> — monitoreo de errores (solo metadata técnica, sin contenido de usuario).</li>
        <li><strong>Cloudflare</strong> — DNS y CDN.</li>
      </ul>

      <h2>6. Almacenamiento y retención</h2>
      <p>
        Tus datos se almacenan en servidores localizados en EE.UU. y
        Europa (depende del proveedor). Conservamos tu información mientras
        tu cuenta esté activa. Si pides eliminar tu cuenta, borramos tu
        contenido en un plazo máximo de <strong>30 días</strong> (con
        excepción de logs de seguridad anonimizados que conservamos hasta
        90 días por obligación legal).
      </p>

      <h2>7. Tus derechos (GDPR / CCPA)</h2>
      <p>Tienes derecho a:</p>
      <ul>
        <li><strong>Acceder</strong> a tus datos — disponible en Ajustes &rarr; Exportar mis datos (JSON completo).</li>
        <li><strong>Rectificar</strong> datos incorrectos — directamente desde la app.</li>
        <li><strong>Eliminar</strong> tu cuenta y todos tus datos asociados — Ajustes &rarr; Eliminar cuenta.</li>
        <li><strong>Portabilidad</strong> — el export en JSON es completo y reutilizable.</li>
        <li><strong>Oponerte</strong> a tratamientos específicos — escríbenos a <a href="mailto:privacy@ultimatetracker.app">privacy@ultimatetracker.app</a>.</li>
        <li><strong>Presentar reclamación</strong> ante la autoridad de protección de datos correspondiente a tu país.</li>
      </ul>

      <h2>8. Menores de edad</h2>
      <p>
        El Servicio no está dirigido a menores de 13 años. No recolectamos
        de forma consciente datos de menores. Si descubres que un menor
        creó una cuenta sin permiso, contáctanos y la eliminaremos.
      </p>

      <h2>9. Seguridad</h2>
      <p>
        Aplicamos medidas técnicas y organizativas razonables: hash de
        contraseñas con <code>bcrypt</code> (13 rondas), HTTPS estricto,
        cookies <code>httpOnly</code> y <code>secure</code>, rate limiting
        en endpoints sensibles, registro de eventos de seguridad, y
        revisiones de código para evitar vulnerabilidades comunes
        (OWASP Top 10).
      </p>
      <p>
        Ninguna medida es 100% infalible. Si detectamos una brecha que
        afecte tus datos, te notificaremos sin demoras indebidas conforme
        al RGPD (artículo 34).
      </p>

      <h2>10. Cambios en esta política</h2>
      <p>
        Si modificamos esta política, actualizaremos la fecha al inicio y
        — para cambios sustantivos — te avisaremos por email o mediante
        un aviso visible en la app.
      </p>

      <h2>11. Contacto</h2>
      <p>
        Para cualquier consulta sobre esta política o sobre el tratamiento
        de tus datos personales, escríbenos a{" "}
        <a href="mailto:privacy@ultimatetracker.app">privacy@ultimatetracker.app</a>.
      </p>
    </LegalLayout>
  );
}
