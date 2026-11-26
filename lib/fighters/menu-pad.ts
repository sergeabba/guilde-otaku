// Manette dans les menus de Fighters (écran titre, sélection, arènes, VS) : chaque appui
// devient la touche clavier équivalente, ce qui réutilise toute la navigation existante.
// Manette 1 : flèches → ZQSD, A → J (valider), B → K (retour), Start → Entrée.
// Manette 2 : flèches, A → Entrée, B → Retour arrière.
import { connectedPads } from "./gamepad";

const MAP: Record<number, [string, string]>[] = [
  { 12: ["KeyW", "w"], 13: ["KeyS", "s"], 14: ["KeyA", "a"], 15: ["KeyD", "d"], 0: ["KeyJ", "j"], 1: ["KeyK", "k"], 9: ["Enter", "Enter"], 8: ["Escape", "Escape"] },
  { 12: ["ArrowUp", "ArrowUp"], 13: ["ArrowDown", "ArrowDown"], 14: ["ArrowLeft", "ArrowLeft"], 15: ["ArrowRight", "ArrowRight"], 0: ["Enter", "Enter"], 1: ["Backspace", "Backspace"], 9: ["Enter", "Enter"], 8: ["Escape", "Escape"] },
];

/** Démarre l'écoute des manettes ; renvoie la fonction d'arrêt. */
export function startMenuPad(): () => void {
  if (typeof window === "undefined" || !navigator.getGamepads) return () => {};
  const prev: boolean[][] = [[], []];
  let raf = 0;
  const tick = () => {
    connectedPads().slice(0, 2).forEach((p, i) => {
      // Stick gauche traité comme la croix.
      const ax = p.axes[0] ?? 0, ay = p.axes[1] ?? 0;
      const virt: Record<number, boolean> = { 12: ay < -0.6, 13: ay > 0.6, 14: ax < -0.6, 15: ax > 0.6 };
      for (const k of Object.keys(MAP[i]).map(Number)) {
        const down = !!p.buttons[k]?.pressed || !!virt[k];
        if (down && !prev[i][k]) {
          const [code, key] = MAP[i][k];
          window.dispatchEvent(new KeyboardEvent("keydown", { code, key, bubbles: true }));
        }
        prev[i][k] = down;
      }
    });
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}
