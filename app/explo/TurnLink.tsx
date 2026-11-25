"use client";

// Lien avec transition de page propre à chaque direction (View Transitions du navigateur ;
// sans prise en charge ou en mouvement réduit, la page change simplement).
import { useRouter } from "next/navigation";
import { viewTransition, waitFor } from "../../lib/view-transition";

export default function TurnLink({ href, kind, morph, children, className, style, label }: {
  href: string; kind: string; morph?: string; children: React.ReactNode; className?: string; style?: React.CSSProperties; label?: string;
}) {
  const router = useRouter();
  return (
    <a href={href} className={className} style={style} aria-label={label} onClick={(e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      const from = morph ? e.currentTarget.querySelector(morph) : null;
      viewTransition({
        kind, from: from ? [[from, "explo-hero"]] : [],
        update: async () => { router.push(href); await waitFor(`[data-explo="${href}"]`, 1200); },
        to: () => (from ? [[document.querySelector("[data-explo-hero]"), "explo-hero"]] : []),
      });
    }}>{children}</a>
  );
}
