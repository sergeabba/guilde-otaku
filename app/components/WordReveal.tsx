import { Children, cloneElement, isValidElement, type ReactNode } from "react";

/**
 * Découpe un titre en mots qui s'allument un à un au fil du défilement (CSS,
 * animation-timeline: view()). Les éléments enfants (ex. <em>) sont conservés.
 * Le texte reste un seul titre pour les lecteurs d'écran.
 */
export default function WordReveal({ children }: { children: ReactNode }) {
  let n = 0;
  const split = (node: ReactNode): ReactNode =>
    Children.map(node, (child) => {
      if (typeof child === "string") {
        return child.split(/(\s+)/).map((part, k) =>
          /^\s+$/.test(part) || part === ""
            ? part
            : <span key={k} className="gk-word" style={{ "--w": n++ } as React.CSSProperties}>{part}</span>);
      }
      if (isValidElement<{ children?: ReactNode }>(child)) {
        return cloneElement(child, undefined, split(child.props.children));
      }
      return child;
    });
  return <span className="gk-words">{split(children)}</span>;
}
