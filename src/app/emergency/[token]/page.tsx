import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EmergencyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!token || token.length < 20) notFound();

  const card = await prisma.emergencyCard.findUnique({
    where: { shareToken: token },
    include: {
      user: { select: { name: true } },
    },
  });

  if (!card) notFound();
  if (!card.shareExpiresAt || card.shareExpiresAt < new Date()) {
    return (
      <div className="min-h-screen bg-brand-paper flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="font-display text-2xl font-bold text-danger mb-2">Enlace expirado</h1>
          <p className="text-sm text-brand-warm">
            Este enlace de emergencia ya no es válido.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-paper p-6">
      <div className="max-w-xl mx-auto">
        <div className="bg-danger text-white rounded-t-2xl p-6">
          <p className="text-xs uppercase tracking-widest opacity-80">Tarjeta médica de emergencia</p>
          <h1 className="font-display text-2xl font-bold m-0 mt-1">
            {card.user.name ?? "Usuario"}
          </h1>
          {card.bloodType && (
            <p className="mt-2 text-sm">
              Tipo de sangre: <span className="font-bold">{card.bloodType}</span>
            </p>
          )}
        </div>
        <div className="bg-white border border-brand-cream rounded-b-2xl p-6 space-y-5">
          <Section title="Alergias" items={card.allergies} fallback="Sin alergias reportadas" />
          <Section title="Condiciones médicas" items={card.conditions} fallback="Sin condiciones reportadas" />
          <Section title="Medicamentos" items={card.medications} fallback="Sin medicamentos reportados" />

          {(card.emergencyName || card.emergencyPhone) && (
            <div>
              <h2 className="text-xs uppercase tracking-widest text-brand-warm font-semibold mb-2">
                Contacto de emergencia
              </h2>
              <p className="font-semibold text-brand-dark">
                {card.emergencyName}
                {card.emergencyRelation && (
                  <span className="text-brand-warm font-normal"> · {card.emergencyRelation}</span>
                )}
              </p>
              {card.emergencyPhone && (
                <a
                  href={`tel:${card.emergencyPhone}`}
                  className="text-xl font-bold text-danger hover:underline"
                >
                  {card.emergencyPhone}
                </a>
              )}
            </div>
          )}

          {card.notes && (
            <div>
              <h2 className="text-xs uppercase tracking-widest text-brand-warm font-semibold mb-2">
                Notas
              </h2>
              <p className="text-sm text-brand-dark whitespace-pre-wrap">{card.notes}</p>
            </div>
          )}

          <p className="text-[11px] text-brand-tan text-center pt-4 border-t border-brand-cream">
            Enlace válido hasta{" "}
            {card.shareExpiresAt.toLocaleString("es-MX", {
              dateStyle: "short",
              timeStyle: "short",
            })}
            · Ultimate TRACKER
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  items,
  fallback,
}: {
  title: string;
  items: string[];
  fallback: string;
}) {
  return (
    <div>
      <h2 className="text-xs uppercase tracking-widest text-brand-warm font-semibold mb-2">
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-brand-tan italic">{fallback}</p>
      ) : (
        <ul className="text-sm text-brand-dark space-y-0.5">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-brand-warm">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
