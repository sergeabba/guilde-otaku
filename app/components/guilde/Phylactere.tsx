// Phylactère : ruban à queues repliées qui porte un nom ou un titre (registre héraldique).
import type { ElementType, ReactNode } from "react";

export default function Phylactere({ children, as: Tag = "span", tone = "paper", className = "" }: { children: ReactNode; as?: ElementType; tone?: "paper" | "gold" | "red" | "ink"; className?: string }) {
  return (
    <Tag className={`phyl is-${tone} ${className}`}>
      <span className="phyl-tail is-l" aria-hidden="true" /><span className="phyl-body">{children}</span><span className="phyl-tail is-r" aria-hidden="true" />
    </Tag>
  );
}
