// Niveaux de difficulté des jeux (partagé par le navigateur et le serveur).
export type Level = "facile" | "normal" | "expert";
export const LEVELS: Level[] = ["facile", "normal", "expert"];
export const LEVEL_LABEL: Record<Level, string> = { facile: "Facile", normal: "Normal", expert: "Expert" };
/** Points multipliés selon le niveau : un expert est récompensé, un débutant n'est pas écrasé. */
export const LEVEL_MULT: Record<Level, number> = { facile: 1, normal: 1.5, expert: 2 };
export const parseLevel = (x: unknown): Level => (x === "facile" || x === "expert" ? x : "normal");
export const withMult = (points: number, level: Level) => Math.round(points * LEVEL_MULT[level]);
