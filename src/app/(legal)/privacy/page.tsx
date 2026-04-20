export const metadata = {
  title: "Política de Privacidad — Habit Tracker",
};

const LAST_UPDATED = "2026-04-19";

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 prose prose-neutral">
      <h1>Política de Privacidad</h1>
      <p className="text-sm text-neutral-500">
        Última actualización: {LAST_UPDATED}
      </p>

      <h2>Qué datos recolectamos</h2>
      <ul>
        <li>
          <strong>Cuenta:</strong> email, nombre (opcional), contraseña hasheada.
        </li>
        <li>
          <strong>Contenido que creas:</strong> hábitos, transacciones, entrenos,
          estado de ánimo, notas, etc.
        </li>
        <li>
          <strong>Técnicos:</strong> logs de errores, fecha/hora de sesión,
          información mínima del navegador.
        </li>
      </ul>

      <h2>Qué NO recolectamos</h2>
      <ul>
        <li>Datos de pago (la beta es gratuita).</li>
        <li>Contactos, ubicación, micrófono o cámara.</li>
        <li>Datos de terceros sobre ti.</li>
      </ul>

      <h2>Para qué los usamos</h2>
      <ul>
        <li>Operar el servicio: guardar tu contenido, autenticarte.</li>
        <li>Detectar abuso y errores (logs).</li>
        <li>Comunicarnos contigo sobre incidencias críticas.</li>
      </ul>
      <p>
        <strong>No vendemos tus datos.</strong> No los compartimos con terceros
        excepto proveedores de infraestructura estrictamente necesarios.
      </p>

      <h2>Dónde se almacenan</h2>
      <ul>
        <li>
          <strong>Base de datos:</strong> PostgreSQL administrado por Railway
          (USA).
        </li>
        <li>
          <strong>Hosting:</strong> Vercel (USA/EU edge).
        </li>
      </ul>

      <h2>Tus derechos</h2>
      <ul>
        <li>
          <strong>Acceso y portabilidad:</strong> puedes exportar todos tus datos
          en JSON desde Ajustes → Cuenta → Exportar datos.
        </li>
        <li>
          <strong>Rectificación:</strong> edita cualquier dato directamente en la
          app.
        </li>
        <li>
          <strong>Eliminación:</strong> Ajustes → Cuenta → Eliminar cuenta. Borra
          todos tus datos de forma permanente en un plazo máximo de 30 días.
        </li>
        <li>
          <strong>Oposición y limitación:</strong> contáctanos al email abajo.
        </li>
      </ul>

      <h2>Cookies</h2>
      <p>
        Usamos una cookie <strong>estrictamente necesaria</strong> para mantener
        tu sesión (<code>authjs.session-token</code>). No usamos cookies de
        marketing ni de terceros. Ver{" "}
        <a href="/cookies">Política de Cookies</a>.
      </p>

      <h2>Seguridad</h2>
      <ul>
        <li>Conexiones HTTPS con HSTS.</li>
        <li>Contraseñas hasheadas con bcrypt (13 rondas).</li>
        <li>Sesiones JWT firmadas.</li>
        <li>Auditorías periódicas del código.</li>
      </ul>

      <h2>Menores</h2>
      <p>
        El servicio no está dirigido a menores de 13 años. Si crees que un menor
        creó una cuenta, contáctanos y la eliminaremos.
      </p>

      <h2>Cambios a esta política</h2>
      <p>
        Avisaremos por email o en la app al menos 7 días antes de cambios
        relevantes.
      </p>

      <h2>Contacto</h2>
      <p>
        Dudas o solicitudes:{" "}
        <a href="mailto:grupobustamante99@gmail.com">
          grupobustamante99@gmail.com
        </a>
      </p>
    </main>
  );
}
