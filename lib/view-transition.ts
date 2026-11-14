// Transitions de vue natives (View Transitions API du navigateur), en amélioration
// progressive : sans prise en charge, ou si le visiteur demande moins d'animations,
// le changement se fait immédiatement, exactement comme avant.
//
// Principes (Apple HIG « Motion ») : mouvement utile et bref, jamais d'attente imposée,
// toute nouvelle action interrompt l'animation en cours.

type Named = [Element | null | undefined, string];

interface VTOptions {
  /** Met à jour le DOM (synchrone avec flushSync, ou promesse pour une navigation). */
  update: () => void | Promise<void>;
  /** Éléments de l'état de départ à nommer (ex. la carte touchée). */
  from?: Named[];
  /** Éléments de l'état d'arrivée à nommer, résolus après la mise à jour. */
  to?: () => Named[];
  /** Famille de transition (CSS : html[data-vt="…"]). */
  kind?: string;
}

interface ViewTransitionLike { finished: Promise<void>; ready: Promise<void>; updateCallbackDone: Promise<void>; skipTransition: () => void }
type DocWithVT = Document & { startViewTransition?: (cb: () => void | Promise<void>) => ViewTransitionLike };

let current: ViewTransitionLike | null = null;
/** Fenêtres dont l'animation d'entrée est coupée pendant une transition (voir motion.css). */
const PAUSED_ENTRANCES = ".sh-sheet, .sh-back, .bb-reader, .bb-reader-back, .pf-panel";

export function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function canViewTransition(): boolean {
  return typeof document !== "undefined" && typeof (document as DocWithVT).startViewTransition === "function" && !reducedMotion();
}

const setName = (el: Element | null | undefined, name: string) => {
  if (el instanceof HTMLElement) el.style.viewTransitionName = name;
};

export function viewTransition({ update, from = [], to, kind = "default" }: VTOptions): void {
  const doc = document as DocWithVT;
  if (!canViewTransition()) { void update(); return; }
  // Une nouvelle action coupe la transition précédente : rien n'attend.
  current?.skipTransition();
  for (const [el, name] of from) setName(el, name);
  document.documentElement.dataset.vt = kind;
  let named: Named[] = [];
  const t = doc.startViewTransition!(async () => {
    for (const [el] of from) setName(el, "");
    await update();
    named = to?.() ?? [];
    for (const [el, name] of named) setName(el, name);
  });
  current = t;
  // Transition abandonnée (page lente, autre action) : le changement a quand même lieu ; pas d'erreur.
  t.ready.catch(() => {});
  t.updateCallbackDone.catch(() => {});
  const done = () => {
    for (const [el] of named) setName(el, "");
    for (const [el] of from) setName(el, "");
    if (current === t) {
      current = null;
      delete document.documentElement.dataset.vt;
      // Les entrées coupées pendant la transition (motion.css) redémarreraient au retrait
      // de l'attribut : on les termine aussitôt pour éviter un second mouvement.
      for (const el of document.querySelectorAll(PAUSED_ENTRANCES)) {
        for (const a of el.getAnimations()) if (a instanceof CSSAnimation) a.finish();
      }
    }
  };
  t.finished.then(done, done);
}

/**
 * Attend qu'un élément apparaisse (nouvelle page rendue), au plus `max` ms :
 * au-delà, la transition se termine quand même pour ne jamais bloquer l'écran.
 * Pas de requestAnimationFrame ici : le navigateur suspend le rendu pendant la mise
 * à jour d'une transition, il ne serait jamais appelé (gel jusqu'au délai de 4 s).
 */
export function waitFor(selector: string, max = 600): Promise<void> {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) { resolve(); return; }
    const done = () => { observer.disconnect(); clearTimeout(timer); resolve(); };
    const observer = new MutationObserver(() => { if (document.querySelector(selector)) done(); });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-member-page"] });
    const timer = setTimeout(done, max);
  });
}
