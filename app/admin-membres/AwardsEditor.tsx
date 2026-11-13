"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { hasJapanese, type MemberAward } from "../../lib/member-extras";

const MAX = 20;
const thisYear = new Date().getFullYear();

/** Palmarès : distinctions multiples, distinctes du grade. La première est la distinction principale. */
export default function AwardsEditor({ awards, onChange }: { awards: MemberAward[]; onChange: (a: MemberAward[]) => void }) {
  const patch = (i: number, p: Partial<MemberAward>) => onChange(awards.map((a, k) => (k === i ? { ...a, ...p } : a)));
  const move = (i: number, d: -1 | 1) => { const l = [...awards]; const j = i + d; if (j < 0 || j >= l.length) return; [l[i], l[j]] = [l[j], l[i]]; onChange(l); };

  return (
    <div className="am-section">
      <h3>Palmarès (distinctions)</h3>
      <p>Récompenses du membre, indépendantes de son grade. La première est la distinction principale (badge sur l&apos;annuaire et la carte).</p>
      {awards.length === 0 ? <p className="am-empty">Aucune distinction. La section Palmarès n&apos;apparaît pas sur la fiche.</p> : (
        <ol className="am-list">
          {awards.map((a, i) => {
            const titleBad = !a.title.trim() || hasJapanese(a.title);
            const descBad = !!a.description && hasJapanese(a.description);
            const yearBad = a.year !== undefined && (a.year < 1990 || a.year > 2100);
            return (
              <li key={i} className="am-item" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
                <div style={{ minWidth: 0, display: "grid", gap: 6 }}>
                  <small>{i === 0 ? "Distinction principale" : `Distinction ${i + 1}`}</small>
                  <input className="am-input" value={a.title} maxLength={80} placeholder="Nom (ex. Homme de l'année)" aria-label={`Nom de la distinction ${i + 1}`}
                    aria-invalid={titleBad} onChange={(e) => patch(i, { title: e.target.value })} />
                  <div className="am-grid2" style={{ gap: 6 }}>
                    <input className="am-input" inputMode="numeric" value={a.year ?? ""} maxLength={4} placeholder={`Année (ex. ${thisYear})`} aria-label={`Année de la distinction ${i + 1}`}
                      aria-invalid={yearBad} onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 4); patch(i, { year: v ? Number(v) : undefined }); }} />
                    <input className="am-input" value={a.description ?? ""} maxLength={240} placeholder="Description (facultatif)" aria-label={`Description de la distinction ${i + 1}`}
                      aria-invalid={descBad} onChange={(e) => patch(i, { description: e.target.value || undefined })} />
                  </div>
                  {(titleBad || descBad || yearBad) && (
                    <small style={{ color: "var(--am-red)" }}>
                      {!a.title.trim() ? "Nom obligatoire (sinon la distinction est ignorée)." : hasJapanese(a.title) || descBad ? "Alphabet latin uniquement." : "Année entre 1990 et 2100."}
                    </small>
                  )}
                </div>
                <div className="am-item-actions" style={{ flexDirection: "column" }}>
                  <button type="button" className="am-icon" aria-label="Monter" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp size={16} aria-hidden="true" /></button>
                  <button type="button" className="am-icon" aria-label="Descendre" disabled={i === awards.length - 1} onClick={() => move(i, 1)}><ArrowDown size={16} aria-hidden="true" /></button>
                  <button type="button" className="am-icon" aria-label={`Retirer ${a.title || "cette distinction"}`} onClick={() => onChange(awards.filter((_, k) => k !== i))}><Trash2 size={16} aria-hidden="true" /></button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <button type="button" className="am-btn am-btn--sm" style={{ justifySelf: "start" }} disabled={awards.length >= MAX}
        onClick={() => onChange([...awards, { title: "" }])}><Plus size={14} aria-hidden="true" /> Ajouter une distinction</button>
    </div>
  );
}

/** Erreurs bloquantes du palmarès avant enregistrement. */
export function awardsIssue(awards: MemberAward[]): string | null {
  for (const a of awards) {
    if (!a.title.trim()) return "Une distinction n'a pas de nom.";
    if (hasJapanese(a.title) || (a.description && hasJapanese(a.description))) return "Palmarès : alphabet latin uniquement.";
    if (a.year !== undefined && (a.year < 1990 || a.year > 2100)) return "Palmarès : année entre 1990 et 2100.";
  }
  return null;
}
