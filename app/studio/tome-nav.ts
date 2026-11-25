// Passage entre tomes et ouverture d'un tome depuis la collection, avec les transitions
// de vue du navigateur (amélioration progressive : sans elles, la page change aussitôt).
// - « open » : l'image touchée (carte, tranche, lien) devient la couverture du tome ;
// - « next » / « prev » : le tome glisse dans le sens de lecture.
import type { useRouter } from "next/navigation";
import { viewTransition, waitFor } from "../../lib/view-transition";

type Router = ReturnType<typeof useRouter>;

export function goTome(router: Router, id: number, dir: "next" | "prev" | "open", from?: Element | null): void {
  const href = `/studio/membre/${id}`;
  viewTransition({
    kind: dir === "open" ? "tome-open" : dir === "next" ? "page-next" : "page-prev",
    from: dir === "open" && from ? [[from, "tome-cover"]] : [],
    update: async () => { router.push(href); await waitFor(`[data-tome="${id}"]`, 900); },
    to: () => (dir === "open" ? [[document.querySelector(`[data-tome="${id}"] .tm2-art-wrap`), "tome-cover"]] : []),
  });
}
