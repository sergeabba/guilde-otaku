import { Trophy } from "lucide-react";
import type { MemberAward } from "../../lib/member-extras";

/** Palmarès d'un membre (distinctions, indépendantes du grade). */
export default function MemberAwards({ awards, limit }: { awards: MemberAward[]; limit?: number }) {
  const list = limit ? awards.slice(0, limit) : awards;
  if (!list.length) return null;
  return (
    <ol className="pf-awards">
      {list.map((a, i) => (
        <li key={`${a.title}-${i}`} className={`pf-award${i === 0 ? " is-main" : ""}`}>
          <span className="pf-award-icon" aria-hidden="true"><Trophy size={18} /></span>
          <div>
            <p className="pf-award-title">{a.title}</p>
            {a.year && <p className="pf-award-year">{a.year}</p>}
            {a.description && !limit && <p className="pf-award-desc">{a.description}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
