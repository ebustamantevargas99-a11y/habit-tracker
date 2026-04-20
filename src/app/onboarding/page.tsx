"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  INTEREST_LABELS,
  BIOLOGICAL_SEX_LABELS,
  ACTIVITY_LEVEL_LABELS,
  FITNESS_LEVEL_LABELS,
  type InterestKey,
  type BiologicalSex,
  type ActivityLevel,
  type FitnessLevel,
  type Units,
} from "@/lib/onboarding-constants";

type Step = 0 | 1 | 2 | 3 | 4;

type FormState = {
  name: string;
  birthDate: string;
  biologicalSex: BiologicalSex | "";
  gender: string;
  pronouns: string;
  heightCm: string;
  weightKg: string;
  units: Units;
  activityLevel: ActivityLevel | "";
  fitnessLevel: FitnessLevel | "";
  interests: InterestKey[];
  primaryGoals: string;
};

const STEP_TITLES = [
  "Bienvenido",
  "Sobre ti",
  "Cuerpo y actividad",
  "Qué te importa",
  "Confirmar",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: "",
    birthDate: "",
    biologicalSex: "",
    gender: "",
    pronouns: "",
    heightCm: "",
    weightKg: "",
    units: "metric",
    activityLevel: "",
    fitnessLevel: "",
    interests: [],
    primaryGoals: "",
  });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleInterest(key: InterestKey) {
    setForm((f) => {
      if (key === "none") {
        return { ...f, interests: f.interests.includes("none") ? [] : ["none"] };
      }
      const hasIt = f.interests.includes(key);
      const next = hasIt
        ? f.interests.filter((i) => i !== key)
        : [...f.interests.filter((i) => i !== "none"), key];
      return { ...f, interests: next };
    });
  }

  function canContinue(): boolean {
    switch (step) {
      case 0:
        return form.name.trim().length > 0;
      case 1:
        return form.birthDate.length === 10 && form.biologicalSex !== "";
      case 2:
        return true;
      case 3:
        return form.interests.length > 0;
      case 4:
        return !submitting;
      default:
        return true;
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        birthDate: form.birthDate,
        biologicalSex: form.biologicalSex,
        gender: form.gender.trim() || null,
        pronouns: form.pronouns.trim() || null,
        heightCm: form.heightCm ? parseFloat(form.heightCm) : null,
        weightKg: form.weightKg ? parseFloat(form.weightKg) : null,
        activityLevel: form.activityLevel || null,
        fitnessLevel: form.fitnessLevel || null,
        units: form.units,
        language: "es",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        darkMode: false,
        interests: form.interests,
        primaryGoals: form.primaryGoals
          .split(",")
          .map((g) => g.trim())
          .filter(Boolean),
        conditions: [],
      };

      const res = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Error guardando tu perfil");
        setSubmitting(false);
        return;
      }

      toast.success("Perfil listo. ¡Vamos!");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Error de conexión");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-paper flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl bg-white rounded-2xl border border-brand-cream shadow-warm-lg p-8 md:p-12">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-widest text-brand-warm font-semibold">
            Paso {step + 1} de {STEP_TITLES.length}
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-brand-dark mt-1">
            {STEP_TITLES[step]}
          </h1>
          <div className="mt-4 h-1 bg-brand-cream rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-500"
              style={{ width: `${((step + 1) / STEP_TITLES.length) * 100}%` }}
            />
          </div>
        </header>

        <main className="min-h-[320px]">
          {step === 0 && <StepWelcome form={form} update={update} />}
          {step === 1 && <StepAboutYou form={form} update={update} />}
          {step === 2 && <StepBody form={form} update={update} />}
          {step === 3 && (
            <StepInterests form={form} toggleInterest={toggleInterest} update={update} />
          )}
          {step === 4 && <StepReview form={form} />}
        </main>

        <footer className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => (s > 0 ? ((s - 1) as Step) : s))}
            disabled={step === 0 || submitting}
            className="px-5 py-2.5 rounded-button text-sm font-medium text-brand-warm hover:bg-brand-cream disabled:opacity-40 transition"
          >
            ← Atrás
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((s) => ((s + 1) as Step))}
              disabled={!canContinue()}
              className="px-6 py-2.5 rounded-button text-sm font-semibold bg-accent text-white hover:bg-brand-brown disabled:opacity-40 transition"
            >
              Continuar →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canContinue()}
              className="px-6 py-2.5 rounded-button text-sm font-semibold bg-accent text-white hover:bg-brand-brown disabled:opacity-40 transition"
            >
              {submitting ? "Guardando…" : "Empezar mi tracking"}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

// ─── Steps ────────────────────────────────────────────────────────────────────

function StepWelcome({
  form,
  update,
}: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  return (
    <div className="space-y-5">
      <p className="text-brand-medium leading-relaxed">
        Bienvenido a <strong className="font-display">Ultimate TRACKER</strong>. Vamos a
        configurar tu perfil en menos de 2 minutos — la app se adapta a ti, no al revés.
      </p>
      <div>
        <label className="block text-sm font-medium text-brand-dark mb-2">
          ¿Cómo te llamas?
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Tu nombre"
          autoFocus
          className="w-full px-4 py-3 rounded-button border border-brand-cream text-brand-dark bg-brand-paper focus:outline-none focus:border-accent transition"
        />
      </div>
    </div>
  );
}

function StepAboutYou({
  form,
  update,
}: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-brand-dark mb-2">
          Fecha de nacimiento <span className="text-danger">*</span>
        </label>
        <input
          type="date"
          value={form.birthDate}
          onChange={(e) => update("birthDate", e.target.value)}
          max={new Date().toISOString().split("T")[0]}
          className="w-full px-4 py-3 rounded-button border border-brand-cream text-brand-dark bg-brand-paper focus:outline-none focus:border-accent"
        />
        <p className="text-xs text-brand-warm mt-1">
          Usamos tu edad para cálculos de fitness, salud y personalización.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-dark mb-2">
          Sexo biológico <span className="text-danger">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(BIOLOGICAL_SEX_LABELS) as BiologicalSex[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => update("biologicalSex", key)}
              className={`px-4 py-3 rounded-button border text-sm transition ${
                form.biologicalSex === key
                  ? "border-accent bg-accent/10 text-brand-dark font-semibold"
                  : "border-brand-cream text-brand-medium hover:border-brand-tan"
              }`}
            >
              {BIOLOGICAL_SEX_LABELS[key]}
            </button>
          ))}
        </div>
        <p className="text-xs text-brand-warm mt-1">
          Necesario para ciertos cálculos médicos (1RM, calorías basales, ciclo).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-brand-dark mb-2">
            Género <span className="text-brand-warm text-xs">(opcional)</span>
          </label>
          <input
            type="text"
            value={form.gender}
            onChange={(e) => update("gender", e.target.value)}
            placeholder="Ej. mujer, hombre, no-binario"
            className="w-full px-4 py-2.5 rounded-button border border-brand-cream text-brand-dark bg-brand-paper focus:outline-none focus:border-accent text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-dark mb-2">
            Pronombres <span className="text-brand-warm text-xs">(opcional)</span>
          </label>
          <input
            type="text"
            value={form.pronouns}
            onChange={(e) => update("pronouns", e.target.value)}
            placeholder="Ej. él, ella, elle"
            className="w-full px-4 py-2.5 rounded-button border border-brand-cream text-brand-dark bg-brand-paper focus:outline-none focus:border-accent text-sm"
          />
        </div>
      </div>
    </div>
  );
}

function StepBody({
  form,
  update,
}: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-brand-warm">
        Todo opcional. Si más tarde quieres entrenar o contar calorías, te conviene llenarlo.
      </p>

      <div>
        <label className="block text-sm font-medium text-brand-dark mb-2">Unidades</label>
        <div className="flex gap-2">
          {(["metric", "imperial"] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => update("units", u)}
              className={`flex-1 px-4 py-2.5 rounded-button border text-sm transition ${
                form.units === u
                  ? "border-accent bg-accent/10 text-brand-dark font-semibold"
                  : "border-brand-cream text-brand-medium hover:border-brand-tan"
              }`}
            >
              {u === "metric" ? "Métrico (kg / cm)" : "Imperial (lb / in)"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-brand-dark mb-2">
            Estatura ({form.units === "metric" ? "cm" : "in"})
          </label>
          <input
            type="number"
            value={form.heightCm}
            onChange={(e) => update("heightCm", e.target.value)}
            placeholder={form.units === "metric" ? "170" : "67"}
            className="w-full px-4 py-2.5 rounded-button border border-brand-cream text-brand-dark bg-brand-paper focus:outline-none focus:border-accent text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-dark mb-2">
            Peso ({form.units === "metric" ? "kg" : "lb"})
          </label>
          <input
            type="number"
            value={form.weightKg}
            onChange={(e) => update("weightKg", e.target.value)}
            placeholder={form.units === "metric" ? "70" : "154"}
            className="w-full px-4 py-2.5 rounded-button border border-brand-cream text-brand-dark bg-brand-paper focus:outline-none focus:border-accent text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-dark mb-2">
          Nivel de actividad
        </label>
        <div className="space-y-2">
          {(Object.keys(ACTIVITY_LEVEL_LABELS) as ActivityLevel[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => update("activityLevel", key)}
              className={`w-full px-4 py-3 rounded-button border text-left transition ${
                form.activityLevel === key
                  ? "border-accent bg-accent/10"
                  : "border-brand-cream hover:border-brand-tan"
              }`}
            >
              <p className="text-sm font-semibold text-brand-dark">
                {ACTIVITY_LEVEL_LABELS[key].label}
              </p>
              <p className="text-xs text-brand-warm">
                {ACTIVITY_LEVEL_LABELS[key].description}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-dark mb-2">
          Nivel de entrenamiento <span className="text-brand-warm text-xs">(opcional)</span>
        </label>
        <div className="flex gap-2">
          {(Object.keys(FITNESS_LEVEL_LABELS) as FitnessLevel[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => update("fitnessLevel", key)}
              className={`flex-1 px-3 py-2.5 rounded-button border text-xs transition ${
                form.fitnessLevel === key
                  ? "border-accent bg-accent/10 text-brand-dark font-semibold"
                  : "border-brand-cream text-brand-medium hover:border-brand-tan"
              }`}
            >
              {FITNESS_LEVEL_LABELS[key].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepInterests({
  form,
  toggleInterest,
  update,
}: {
  form: FormState;
  toggleInterest: (k: InterestKey) => void;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  const keys = Object.keys(INTEREST_LABELS) as InterestKey[];

  return (
    <div className="space-y-5">
      <p className="text-sm text-brand-medium">
        Selecciona <strong>todo lo que te interese trackear</strong>. Los módulos
        correspondientes se activarán automáticamente. Puedes cambiarlos en cualquier momento
        desde Ajustes.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[380px] overflow-y-auto pr-1">
        {keys.map((key) => {
          const active = form.interests.includes(key);
          const label = INTEREST_LABELS[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleInterest(key)}
              className={`px-4 py-3 rounded-button border text-left transition ${
                active
                  ? "border-accent bg-accent/10"
                  : "border-brand-cream hover:border-brand-tan"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{label.emoji}</span>
                <span className="text-sm font-semibold text-brand-dark">
                  {label.label}
                </span>
              </div>
              <p className="text-xs text-brand-warm mt-1">{label.description}</p>
            </button>
          );
        })}
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-dark mb-2">
          Metas principales <span className="text-brand-warm text-xs">(opcional, separa por comas)</span>
        </label>
        <input
          type="text"
          value={form.primaryGoals}
          onChange={(e) => update("primaryGoals", e.target.value)}
          placeholder="Ej. bajar 5kg, dormir 8h, leer 20 libros"
          className="w-full px-4 py-2.5 rounded-button border border-brand-cream text-brand-dark bg-brand-paper focus:outline-none focus:border-accent text-sm"
        />
      </div>
    </div>
  );
}

function StepReview({ form }: { form: FormState }) {
  const interests = form.interests.map((i) => INTEREST_LABELS[i].label).join(", ");
  return (
    <div className="space-y-4">
      <p className="text-brand-medium">Esto es lo que guardaremos:</p>
      <dl className="space-y-3 bg-brand-paper rounded-card p-5 border border-brand-cream text-sm">
        <Row label="Nombre" value={form.name} />
        <Row label="Nacimiento" value={form.birthDate} />
        <Row
          label="Sexo biológico"
          value={form.biologicalSex ? BIOLOGICAL_SEX_LABELS[form.biologicalSex] : "—"}
        />
        {form.gender && <Row label="Género" value={form.gender} />}
        {form.heightCm && (
          <Row
            label="Estatura"
            value={`${form.heightCm} ${form.units === "metric" ? "cm" : "in"}`}
          />
        )}
        {form.weightKg && (
          <Row
            label="Peso"
            value={`${form.weightKg} ${form.units === "metric" ? "kg" : "lb"}`}
          />
        )}
        {form.activityLevel && (
          <Row label="Actividad" value={ACTIVITY_LEVEL_LABELS[form.activityLevel].label} />
        )}
        {form.fitnessLevel && (
          <Row label="Nivel fitness" value={FITNESS_LEVEL_LABELS[form.fitnessLevel].label} />
        )}
        <Row label="Intereses" value={interests || "—"} />
      </dl>
      <p className="text-xs text-brand-warm">
        Podrás editar todo desde <strong>Ajustes</strong>. Tus datos nunca salen a servers
        externos — solo los que tú decidas copiar a tu IA personal.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-brand-warm">{label}</dt>
      <dd className="text-brand-dark font-medium text-right">{value}</dd>
    </div>
  );
}
