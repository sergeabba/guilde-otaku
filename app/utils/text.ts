/** Minuscules sans accents, pour des recherches tolérantes ("emeraude" trouve "Émeraude"). */
export function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}
