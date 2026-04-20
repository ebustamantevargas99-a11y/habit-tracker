export type AIProvider = "claude" | "chatgpt" | "gemini" | "other";

export type ExportScope =
  | "daily"
  | "weekly"
  | "monthly"
  | "fitness"
  | "finance"
  | "wellness"
  | "nutrition"
  | "habits"
  | "holistic";

export type AnalysisStyle =
  | "coach"
  | "analyst"
  | "retrospective"
  | "projection";

export type ExportRequest = {
  scope: ExportScope;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  provider: AIProvider;
  style: AnalysisStyle;
  customQuestion?: string;
};

export type ExportResponse = {
  prompt: string;
  scope: ExportScope;
  dataPoints: number;
  generatedAt: string;
};

export const PROVIDER_URLS: Record<AIProvider, string | null> = {
  claude: "https://claude.ai/new",
  chatgpt: "https://chatgpt.com/",
  gemini: "https://gemini.google.com/app",
  other: null,
};

export const PROVIDER_LABELS: Record<AIProvider, string> = {
  claude: "Claude",
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  other: "Otro",
};

export const SCOPE_LABELS: Record<ExportScope, string> = {
  daily: "Cierre del día",
  weekly: "Resumen semanal",
  monthly: "Resumen mensual",
  fitness: "Fitness (entrenos + PRs)",
  finance: "Finanzas",
  wellness: "Salud mental + sueño",
  nutrition: "Nutrición",
  habits: "Hábitos",
  holistic: "Análisis holístico completo",
};

export const STYLE_LABELS: Record<AnalysisStyle, { label: string; description: string }> = {
  coach: {
    label: "Coach",
    description: "Te habla como coach personal. Directo, motivacional, accionable.",
  },
  analyst: {
    label: "Analista",
    description: "Frío y objetivo. Solo datos, patrones, números.",
  },
  retrospective: {
    label: "Retrospectiva",
    description: "Reflexión sobre lo que hiciste, aprendiste y vivenciaste.",
  },
  projection: {
    label: "Proyección",
    description: "Usa la data para proyectar escenarios futuros con tendencias.",
  },
};
