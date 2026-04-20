export const metadata = {
  title: "Política de Cookies — Habit Tracker",
};

const LAST_UPDATED = "2026-04-19";

export default function CookiesPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 prose prose-neutral">
      <h1>Política de Cookies</h1>
      <p className="text-sm text-neutral-500">
        Última actualización: {LAST_UPDATED}
      </p>

      <h2>¿Qué cookies usamos?</h2>
      <p>
        Habit Tracker usa <strong>una sola cookie estrictamente necesaria</strong>
        : la cookie de sesión de autenticación.
      </p>

      <table>
        <thead>
          <tr>
            <th>Cookie</th>
            <th>Propósito</th>
            <th>Duración</th>
            <th>Tipo</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>authjs.session-token</code> /{" "}
              <code>__Secure-authjs.session-token</code>
            </td>
            <td>Mantener tu sesión iniciada</td>
            <td>30 días</td>
            <td>Estrictamente necesaria</td>
          </tr>
        </tbody>
      </table>

      <h2>¿Cookies de terceros?</h2>
      <p>
        <strong>No.</strong> No usamos Google Analytics, Facebook Pixel, ni
        ninguna cookie de marketing o tracking de terceros.
      </p>

      <h2>Tu control</h2>
      <p>
        Puedes borrar la cookie desde tu navegador. Si lo haces, necesitarás
        iniciar sesión de nuevo.
      </p>

      <h2>Más información</h2>
      <p>
        Ver <a href="/privacy">Política de Privacidad</a>.
      </p>
    </main>
  );
}
