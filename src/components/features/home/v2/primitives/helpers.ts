// Utilidades de formateo i18n-light del home v2.

export const MONTHS_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

export const DAYS_ES = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
] as const;

export function formatFechaLarga(d: Date): string {
  return `${DAYS_ES[d.getDay()]}, ${d.getDate()} de ${MONTHS_ES[d.getMonth()]} de ${d.getFullYear()}`;
}

export function greetingFor(hour: number, name = "tú"): string {
  if (hour < 12) return `Buenos días, ${name}`;
  if (hour < 19) return `Buenas tardes, ${name}`;
  return `Buenas noches, ${name}`;
}

export function lifeScoreMessage(score: number): string {
  if (score >= 85) return "Este ritmo es el que estabas buscando.";
  if (score >= 72) return "La semana sostiene su forma. Sigue ahí.";
  if (score >= 60) return "Hay dirección, aunque el camino pide paciencia.";
  if (score >= 45) return "Toma aire. Un pequeño paso basta hoy.";
  return "Es un buen momento para recalibrar sin prisa.";
}
