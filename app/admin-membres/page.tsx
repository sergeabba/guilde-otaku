"use client";

// Administration des membres : retrouver (recherche, filtres, aperçu), ajouter,
// modifier (éditeur par onglets), masquer, supprimer, réordonner, assigner un pays.
import { useEffect, useMemo, useState } from "react";
import { Camera, EyeOff, Globe, GripVertical, Pencil, Plus, User, X } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "../../lib/supabase";
import { adminDb } from "../../lib/admin-db-client";
import { invalidateMembersCache } from "../utils/dataAdapter";
import type { SupabaseMemberRow } from "../types";
import { RANK_FILTER_ORDER } from "../../data/members";
import { rankAccents, type Rank } from "../config/ranks";
import { COUNTRIES, flagUrl } from "../config/countries";
import AdminShell from "../admin-ui/AdminShell";
import { Chip, ListToolbar, norm, useToast } from "../admin-ui/ui";
import MemberEditor from "./MemberEditor";

const isVideo = (url: string) => /\.(mp4|webm|mov)$/i.test(url);
type Filter = "tous" | "masques" | "sans-photo";

function SortableRow({ id, children }: { id: number; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <li ref={setNodeRef} className="am-row-item" style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }}>
      <button type="button" className="am-icon am-drag" {...attributes} {...listeners} aria-label="Déplacer (glisser, ou flèches du clavier)"><GripVertical size={18} aria-hidden="true" /></button>
      {children}
    </li>
  );
}

export default function AdminMembresPage() {
  const [fighters, setFighters] = useState<SupabaseMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [rank, setRank] = useState<Rank | "tous">("tous");
  const [filter, setFilter] = useState<Filter>("tous");
  const [editing, setEditing] = useState<SupabaseMemberRow | "new" | null>(null);
  const [reorder, setReorder] = useState(false);
  const [quickCountry, setQuickCountry] = useState<string | null>(null);
  const [notify, toasts] = useToast();

  // La colonne `extras` (favoris, cadrage, musique) n'existe qu'après la migration.
  const extrasSupported = fighters.some((f) => f.extras !== undefined);

  async function load() {
    setLoading(true); setLoadError(null);
    const { data, error } = await supabase.from("fighters").select("*").order("position", { ascending: true, nullsFirst: false }).order("id", { ascending: true });
    if (error) setLoadError(`Lecture des membres impossible : ${error.message}. Vérifie la connexion puis recharge.`);
    if (data) setFighters(data);
    setLoading(false);
  }
  useEffect(() => { void Promise.resolve().then(load); }, []);

  const filtered = useMemo(() => fighters.filter((f) => {
    if (query && !norm(`${f.name} ${f.rank} ${f.badge ?? ""}`).includes(norm(query))) return false;
    if (rank !== "tous" && f.rank !== rank) return false;
    if (filter === "masques" && !f.hidden) return false;
    if (filter === "sans-photo" && (f.photo || f.animechar)) return false;
    return true;
  }), [fighters, query, rank, filter]);
  const ranks = useMemo(() => RANK_FILTER_ORDER.filter((r) => fighters.some((f) => f.rank === r)), [fighters]);

  function upsertLocal(row: SupabaseMemberRow, message: string) {
    setFighters((prev) => (prev.some((f) => f.id === row.id) ? prev.map((f) => (f.id === row.id ? row : f)) : [...prev, row]));
    invalidateMembersCache();
    notify(message);
  }

  async function assignCountry(m: SupabaseMemberRow) {
    if (!quickCountry) return;
    const { error } = await adminDb.update("fighters", m.id, { country: quickCountry });
    if (error) { notify(`Pays non enregistré pour ${m.name} : ${error.message}`, "error"); return; }
    invalidateMembersCache();
    setFighters((p) => p.map((f) => (f.id === m.id ? { ...f, country: quickCountry } : f)));
    notify(`${m.name} : ${COUNTRIES.find((c) => c.code === quickCountry)?.label ?? quickCountry}`);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = fighters.findIndex((f) => f.id === active.id), to = fighters.findIndex((f) => f.id === over.id);
    const next = arrayMove(fighters, from, to);
    setFighters(next);
    for (const [i, f] of next.entries()) {
      if (f.position === i) continue;
      const { error } = await adminDb.update("fighters", f.id, { position: i });
      if (error) { notify(`Ordre non enregistré (${f.name}) : ${error.message}`, "error"); return; }
    }
    setFighters(next.map((f, i) => ({ ...f, position: i })));
    invalidateMembersCache();
    notify("Ordre de l'annuaire enregistré");
  }

  const thumb = (f: SupabaseMemberRow) => {
    const src = f.photo || f.animechar;
    return src && !isVideo(src)
      // eslint-disable-next-line @next/next/no-img-element
      ? <img src={src} alt="" loading="lazy" style={{ objectPosition: "50% 15%" }} />
      : <User size={22} aria-hidden="true" />;
  };

  return (
    <AdminShell
      section="membres" title="Membres"
      intro="Touche un membre pour modifier son identité, ses portraits, sa fiche de combat et son univers. Rien n'est publié tant que tu n'as pas enregistré."
      actions={<>
        <button type="button" className="am-btn" aria-pressed={reorder} onClick={() => { setReorder((v) => !v); setQuery(""); setRank("tous"); setFilter("tous"); }}>
          <GripVertical size={16} aria-hidden="true" /> {reorder ? "Terminer l'ordre" : "Changer l'ordre"}
        </button>
        <button type="button" className="am-btn am-btn--gold" onClick={() => setEditing("new")}><Plus size={16} aria-hidden="true" /> Ajouter un membre</button>
      </>}
    >
      {loadError && <p className="am-alert am-alert--error" role="alert">{loadError} <button type="button" className="am-btn am-btn--sm" onClick={load}>Réessayer</button></p>}

      {!reorder && (
        <>
          <ListToolbar query={query} onQuery={setQuery} placeholder="Rechercher un membre (nom, grade, distinction)" count={filtered.length} total={fighters.length}>
            <Chip active={filter === "tous"} onClick={() => setFilter("tous")}>Tous</Chip>
            <Chip active={filter === "masques"} onClick={() => setFilter("masques")}>Masqués ({fighters.filter((f) => f.hidden).length})</Chip>
            <Chip active={filter === "sans-photo"} onClick={() => setFilter("sans-photo")}>Sans photo ({fighters.filter((f) => !f.photo && !f.animechar).length})</Chip>
          </ListToolbar>
          <div className="am-chips" role="group" aria-label="Filtrer par grade">
            <Chip active={rank === "tous"} onClick={() => setRank("tous")}>Tous les grades</Chip>
            {ranks.map((r) => <Chip key={r} active={rank === r} onClick={() => setRank(r)}>{r}</Chip>)}
          </div>
          <div className={`am-quick${quickCountry ? " is-on" : ""}`}>
            <Globe size={16} aria-hidden="true" />
            <label className="am-quick-label" htmlFor="am-quick-country">{quickCountry ? "Touche les membres à qui donner ce pays" : "Assigner un pays à plusieurs membres"}</label>
            <select id="am-quick-country" className="am-input" value={quickCountry ?? ""} onChange={(e) => setQuickCountry(e.target.value || null)}>
              <option value="">Choisir un pays…</option>
              {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
            {quickCountry && <button type="button" className="am-icon" onClick={() => setQuickCountry(null)} aria-label="Arrêter l'assignation de pays"><X size={16} aria-hidden="true" /></button>}
          </div>
        </>
      )}

      {loading ? <p className="am-loading" role="status">Chargement des membres…</p>
        : reorder ? (
          <section className="am-panel" aria-label="Ordre de l'annuaire">
            <p className="am-intro">Glisse les membres (ou utilise la poignée et les flèches du clavier). Chaque changement est enregistré.</p>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={fighters.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                <ol className="am-rows">
                  {fighters.map((f, i) => (
                    <SortableRow key={f.id} id={f.id}>
                      <div className="am-row-main"><strong>{i + 1}. {f.name}</strong><small>{f.rank}{f.hidden ? " · masqué" : ""}</small></div>
                    </SortableRow>
                  ))}
                </ol>
              </SortableContext>
            </DndContext>
          </section>
        ) : filtered.length === 0 ? (
          <p className="am-empty-state">Aucun membre ne correspond. <button type="button" className="am-btn am-btn--sm" onClick={() => { setQuery(""); setRank("tous"); setFilter("tous"); }}>Tout réafficher</button></p>
        ) : (
          <ul className="am-member-grid">
            {filtered.map((f) => {
              const c = rankAccents[f.rank as Rank] ?? "#9CA3AF";
              return (
                <li key={f.id} className={`am-member${f.hidden ? " is-hidden" : ""}${quickCountry && f.country === quickCountry ? " is-match" : ""}`} style={{ "--rk": c } as React.CSSProperties}>
                  <button type="button" className="am-member-open" onClick={() => (quickCountry ? assignCountry(f) : setEditing(f))}
                    aria-label={quickCountry ? `Donner ce pays à ${f.name}` : `Modifier ${f.name}`}>
                    <span className="am-member-photo">{thumb(f)}</span>
                    <span className="am-member-info">
                      <span className="am-member-rank">{f.rank}</span>
                      <strong>{f.name}</strong>
                      <span className="am-row-tags">
                        {f.hidden && <span className="am-tag is-warn"><EyeOff size={11} aria-hidden="true" /> Masqué</span>}
                        {!f.photo && !f.animechar && <span className="am-tag is-warn"><Camera size={11} aria-hidden="true" /> Sans photo</span>}
                        {f.country && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={flagUrl(f.country)} alt={COUNTRIES.find((x) => x.code === f.country)?.label ?? f.country} width={20} height={14} />
                        )}
                      </span>
                    </span>
                    <span className="am-member-edit" aria-hidden="true">{quickCountry ? <Globe size={15} /> : <><Pencil size={14} /> Modifier</>}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

      {editing && (
        <MemberEditor
          key={editing === "new" ? "new" : editing.id}
          member={editing === "new" ? null : editing}
          extrasSupported={extrasSupported}
          onClose={() => setEditing(null)}
          onSaved={upsertLocal}
          onDeleted={(id, name) => { setFighters((p) => p.filter((f) => f.id !== id)); invalidateMembersCache(); setEditing(null); notify(`${name} supprimé`); }}
        />
      )}
      {toasts}
    </AdminShell>
  );
}
