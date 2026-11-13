// Calculs d'anniversaires, toujours dans le fuseau du visiteur.
// Les dates sont stockées sans année ("12 mars") : seuls jour et mois comptent.

const MS_DAY = 86_400_000;

export const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/**
 * Date à laquelle on fête (jour, mois) pendant l'année `year`.
 * Un 29 février se fête le 28 les années non bissextiles.
 */
export function occurrenceIn(year: number, day: number, month: number): Date {
  const d = month === 2 && day === 29 && !isLeapYear(year) ? 28 : day;
  return new Date(year, month - 1, d);
}

/** Prochaine occurrence, aujourd'hui inclus (minuit local). */
export function nextOccurrence(day: number, month: number, now: Date = new Date()): Date {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisYear = occurrenceIn(now.getFullYear(), day, month);
  return thisYear >= today ? thisYear : occurrenceIn(now.getFullYear() + 1, day, month);
}

/** Nombre de jours calendaires jusqu'à la prochaine occurrence (0 = aujourd'hui). */
export function daysUntil(day: number, month: number, now: Date = new Date()): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const next = nextOccurrence(day, month, now);
  // Math.round absorbe les décalages d'une heure aux changements d'heure
  return Math.round((next.getTime() - today.getTime()) / MS_DAY);
}

export interface Countdown { days: number; hours: number; minutes: number; seconds: number; done: boolean }

/** Temps restant jusqu'à minuit (heure locale) du jour de l'anniversaire. */
export function countdownTo(target: Date, now: Date = new Date()): Countdown {
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  const s = Math.floor(diff / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    done: false,
  };
}
