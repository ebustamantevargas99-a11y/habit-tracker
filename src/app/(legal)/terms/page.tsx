export const metadata = {
  title: "Términos de Servicio — Habit Tracker",
};

const LAST_UPDATED = "2026-04-19";

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 prose prose-neutral">
      <h1>Términos de Servicio</h1>
      <p className="text-sm text-neutral-500">
        Última actualización: {LAST_UPDATED}
      </p>

      <h2>1. Aceptación</h2>
      <p>
        Al usar Habit Tracker aceptas estos términos. Si no estás de acuerdo, no
        uses el servicio.
      </p>

      <h2>2. Descripción del servicio</h2>
      <p>
        Habit Tracker es una aplicación para registrar hábitos, finanzas
        personales, actividad física, bienestar y productividad. El servicio se
        ofrece en fase <strong>beta gratuita</strong>.
      </p>

      <h2>3. Tu cuenta</h2>
      <ul>
        <li>Eres responsable de mantener tu contraseña segura.</li>
        <li>Debes proporcionar información verdadera al registrarte.</li>
        <li>
          Puedes eliminar tu cuenta en cualquier momento desde Ajustes → Cuenta.
        </li>
      </ul>

      <h2>4. Uso aceptable</h2>
      <p>No puedes:</p>
      <ul>
        <li>Usar el servicio para actividades ilegales.</li>
        <li>Intentar acceder a datos de otros usuarios.</li>
        <li>Hacer ingeniería inversa, scrape o explotar vulnerabilidades.</li>
        <li>Enviar spam, malware o contenido dañino.</li>
      </ul>

      <h2>5. Disponibilidad</h2>
      <p>
        El servicio se ofrece "tal cual". Siendo beta, puede haber interrupciones,
        cambios, o pérdida temporal de datos. Haz tus propios respaldos de
        información crítica.
      </p>

      <h2>6. Limitación de responsabilidad</h2>
      <p>
        No somos responsables de pérdidas indirectas, lucro cesante o daños
        emergentes del uso del servicio. La responsabilidad máxima está limitada
        al monto pagado en los últimos 12 meses (en beta gratuita: cero).
      </p>

      <h2>7. Cambios en estos términos</h2>
      <p>
        Podemos actualizar estos términos. Los cambios relevantes se notificarán
        por email o en la app al menos 7 días antes de entrar en vigor.
      </p>

      <h2>8. Ley aplicable</h2>
      <p>
        Estos términos se rigen por las leyes de México. Jurisdicción: tribunales
        competentes del domicilio del titular del servicio.
      </p>

      <h2>9. Contacto</h2>
      <p>
        Preguntas o disputas:{" "}
        <a href="mailto:grupobustamante99@gmail.com">
          grupobustamante99@gmail.com
        </a>
      </p>
    </main>
  );
}
