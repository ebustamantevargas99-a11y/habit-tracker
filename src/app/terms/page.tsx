import type { Metadata } from "next";
import LegalLayout from "@/components/features/legal/legal-layout";

export const metadata: Metadata = {
  title: "Términos de Servicio — Ultimate TRACKER",
  description:
    "Términos y condiciones de uso de Ultimate TRACKER.",
};

export default function TermsPage() {
  return (
    <LegalLayout
      title="Términos de Servicio"
      intro="Reglas claras para usar el Servicio de forma justa para todos."
      lastUpdated="25 de abril de 2026"
    >
      <h2>1. Aceptación</h2>
      <p>
        Al crear una cuenta o usar Ultimate TRACKER (&ldquo;el Servicio&rdquo;)
        aceptas estos Términos. Si no estás de acuerdo, no uses el Servicio.
        Te recomendamos leerlos completos antes de continuar.
      </p>

      <h2>2. Cuenta de usuario</h2>
      <ul>
        <li>Debes tener al menos <strong>13 años</strong> para usar el Servicio. Si tienes entre 13 y la mayoría de edad legal de tu país, debes contar con consentimiento de tu tutor.</li>
        <li>Eres responsable de mantener segura tu contraseña y de toda actividad realizada bajo tu cuenta.</li>
        <li>Una persona = una cuenta. No compartas credenciales.</li>
        <li>Debes proporcionar información veraz al registrarte (email funcional, nombre real opcional).</li>
      </ul>

      <h2>3. Uso aceptable</h2>
      <p>Te comprometes a NO:</p>
      <ul>
        <li>Usar el Servicio para actividades ilegales, fraudulentas o que infrinjan derechos de terceros.</li>
        <li>Subir contenido violento, sexual explícito que involucre menores, discursos de odio, o malware.</li>
        <li>Intentar acceder a cuentas ajenas, evadir mecanismos de seguridad, o interrumpir el funcionamiento del Servicio.</li>
        <li>Usar bots, scrapers, o scripts automatizados para extraer datos masivamente de la API.</li>
        <li>Revender el Servicio o ofrecerlo como base para una plataforma competidora.</li>
      </ul>

      <h2>4. Tu contenido</h2>
      <p>
        Todo lo que registras en el Servicio (hábitos, comidas, entrenos,
        notas, etc.) es <strong>tuyo</strong>. No reclamamos propiedad
        sobre tu contenido. Nos otorgas únicamente la licencia mínima
        necesaria para almacenarlo y mostrártelo.
      </p>
      <p>
        Eres responsable del contenido que subas. Si alguien reclama que
        infringe sus derechos, podríamos suspenderlo temporalmente y
        contactarte para resolverlo.
      </p>

      <h2>5. Propiedad intelectual del Servicio</h2>
      <p>
        El código, diseño, marca, logos, y materiales del Servicio son
        propiedad de Ultimate TRACKER y están protegidos por derechos de
        autor y marcas registradas. Tienes una licencia limitada,
        revocable y no exclusiva para usarlos como parte del Servicio.
      </p>

      <h2>6. Disponibilidad y cambios</h2>
      <ul>
        <li>El Servicio se ofrece &ldquo;tal cual&rdquo;, sin garantía de disponibilidad ininterrumpida.</li>
        <li>Podemos modificar, suspender o discontinuar funciones con aviso razonable cuando sea posible.</li>
        <li>Hacemos copias de seguridad, pero te recomendamos exportar tu data periódicamente desde Ajustes &rarr; Exportar mis datos.</li>
      </ul>

      <h2>7. Beta gratuita</h2>
      <p>
        Durante la fase beta el Servicio se ofrece <strong>sin costo</strong>.
        Si en el futuro introducimos planes de pago, los usuarios beta
        existentes tendrán condiciones preferentes y aviso previo de al
        menos 30 días antes de cualquier cambio.
      </p>

      <h2>8. Eliminación de cuenta</h2>
      <p>
        Puedes eliminar tu cuenta en cualquier momento desde{" "}
        <strong>Ajustes &rarr; Eliminar cuenta</strong>. La eliminación es{" "}
        <strong>permanente</strong> y borra todos tus datos en un plazo
        máximo de 30 días.
      </p>
      <p>
        Podemos suspender o cancelar cuentas que violen estos Términos,
        notificando previamente cuando sea posible.
      </p>

      <h2>9. Limitación de responsabilidad</h2>
      <p>
        El Servicio es una <strong>herramienta de seguimiento personal</strong>{" "}
        y no sustituye asesoramiento médico, nutricional, financiero ni
        legal profesional. Las recomendaciones, gráficas y resúmenes son
        informativos.
      </p>
      <p>
        En la máxima extensión permitida por la ley, no nos hacemos
        responsables por daños indirectos, incidentales, consecuentes o
        punitivos derivados del uso del Servicio.
      </p>

      <h2>10. Función &ldquo;Exportar a IA&rdquo;</h2>
      <p>
        El Servicio te permite copiar tus datos a un proveedor externo de
        IA. Esa interacción la inicias tú, queda fuera de nuestra
        responsabilidad y se rige por los términos del proveedor que
        elijas (Claude, ChatGPT, Gemini, etc.).
      </p>

      <h2>11. Cambios en estos Términos</h2>
      <p>
        Podemos actualizar estos Términos. Si los cambios son sustantivos,
        te notificaremos por email o mediante un aviso visible en la app
        con al menos 14 días de antelación. Continuar usando el Servicio
        después de la entrada en vigor implica aceptación.
      </p>

      <h2>12. Ley aplicable</h2>
      <p>
        Estos Términos se rigen por las leyes del país de residencia del
        operador del Servicio. Cualquier disputa se resolverá ante los
        tribunales competentes de dicha jurisdicción, sin perjuicio de
        los derechos del consumidor en su país.
      </p>

      <h2>13. Contacto</h2>
      <p>
        Si tienes preguntas sobre estos Términos, escríbenos a{" "}
        <a href="mailto:legal@ultimatetracker.app">legal@ultimatetracker.app</a>.
      </p>
    </LegalLayout>
  );
}
