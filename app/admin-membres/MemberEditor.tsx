"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, Eye, EyeOff, Trash2, X } from "lucide-react";
import { RANK_FILTER_ORDER, type Rank } from "../../data/members";
import { COUNTRIES } from "../config/countries";
import { adminDb } from "../../lib/admin-db-client";
import { hasJapanese, memberAwards, parseMemberExtras, type FocusPoint, type MemberExtras } from "../../lib/member-extras";
import type { SupabaseMemberRow } from "../types";
import PortraitPanel from "./PortraitPanel";
import UniverseEditor from "./UniverseEditor";
import AwardsEditor, { awardsIssue } from "./AwardsEditor";

type Tab = "identite" | "portraits" | "univers";

interface Identity { name: string; rank: Rank; badge: string; birthday: string; country: string; color: string; bio: string }

const toIdentity = (m: SupabaseMemberRow | null): Identity => ({
  name: m?.name ?? "", rank: (m?.rank as Rank) ?? "New G dorée", badge: m?.badge ?? "", birthday: m?.birthday ?? "",
  country: m?.country ?? "", color: m?.color ?? "#E91E8C", bio: m?.bio ?? "",
});

function identityErrors(v: Identity): Partial<Record<keyof Identity, string>> {
  const e: Partial<Record<keyof Identity, string>> = {};
  if (!v.name.trim()) e.name = "Le nom est obligatoire.";
  else if (v.name.length > 80) e.name = "80 caractères maximum.";
  if (!/^#[0-9a-fA-F]{6}$/.test(v.color)) e.color = "Couleur au format #RRGGBB.";
  if (v.bio.length > 1200) e.bio = "1200 caractères maximum.";
  if (v.badge.length > 80) e.badge = "80 caractères maximum.";
  for (const k of ["name", "badge", "bio", "birthday"] as const) if (!e[k] && hasJapanese(v[k])) e[k] = "Alphabet latin uniquement (règle rōmaji du site).";
  return e;
}

export default function MemberEditor({ member, extrasSupported, onClose, onSaved, onDeleted }: {
  member: SupabaseMemberRow | null;
  extrasSupported: boolean;
  onClose: () => void;
  onSaved: (row: SupabaseMemberRow, message: string) => void;
  onDeleted: (id: number, name: string) => void;
}) {
  const [row, setRow] = useState<SupabaseMemberRow | null>(member);
  const [tab, setTab] = useState<Tab>("identite");
  const [form, setForm] = useState<Identity>(() => toIdentity(member));
  // Palmarès : si aucun n'est encore saisi, on part de l'ancienne distinction unique (colonne badge).
  const initialExtras = (): MemberExtras => {
    const x = parseMemberExtras(member?.extras) ?? {};
    if (extrasSupported && !x.awards?.length) { const a = memberAwards({ badge: member?.badge }); if (a.length) x.awards = a; }
    return x;
  };
  const [extras, setExtras] = useState<MemberExtras>(initialExtras);
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify([toIdentity(member), initialExtras()]));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [touched, setTouched] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const errors = identityErrors(form);
  const dirty = JSON.stringify([form, extras]) !== savedSnapshot;
  const isNew = !row;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sheetRef.current?.querySelector<HTMLElement>("input, button")?.focus();
    return () => { document.body.style.overflow = prev; };
  }, []);

  const requestClose = () => {
    if (dirty && !window.confirm("Des modifications ne sont pas enregistrées. Fermer quand même ?")) return;
    onClose();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") requestClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const set = <K extends keyof Identity>(k: K, v: Identity[K]) => { setForm((f) => ({ ...f, [k]: v })); setNotice(null); setError(null); };
  const patchExtras = (p: Partial<MemberExtras>) => { setExtras((x) => ({ ...x, ...p })); setNotice(null); setError(null); };

  async function save() {
    setTouched(true); setError(null); setNotice(null);
    if (Object.keys(errors).length) { setTab("identite"); setError("Corrige les champs signalés avant d'enregistrer."); return; }
    const awardErr = extrasSupported ? awardsIssue(extras.awards ?? []) : null;
    if (awardErr) { setTab("identite"); setError(awardErr); return; }
    setSaving(true);
    const values: Record<string, unknown> = {
      name: form.name.trim(), rank: form.rank, badge: form.badge.trim() || null, birthday: form.birthday.trim(),
      country: form.country || null, color: form.color, bio: form.bio.trim(),
    };
    if (extrasSupported) {
      const awards = (extras.awards ?? []).map((a) => ({ ...a, title: a.title.trim(), description: a.description?.trim() || undefined }));
      values.extras = { ...extras, awards: awards.length ? awards : undefined };
      // L'ancienne colonne `badge` suit la distinction principale (annuaire, Wanted, recherche).
      values.badge = awards[0]?.title ?? null;
    }

    if (row) {
      const { error: err } = await adminDb.update("fighters", row.id, values);
      setSaving(false);
      if (err) { setError(`Enregistrement refusé : ${err.message}`); return; }
      // `extras` n'est ajouté à la ligne locale que si la colonne existe (sinon la page la croirait migrée).
      const next = { ...row, ...values } as SupabaseMemberRow;
      setRow(next);
      setSavedSnapshot(JSON.stringify([form, extras]));
      setNotice("Modifications enregistrées. Elles sont visibles sur le site au prochain chargement.");
      onSaved(next, `${next.name} mis à jour`);
    } else {
      const created = { ...values, photo: "", animechar: "", stats: { force: 50, vitesse: 50, technique: 50 }, special: { name: "—", effect: "—" } };
      const { data, error: err } = await adminDb.insert("fighters", [created]);
      setSaving(false);
      if (err || !data?.[0]) { setError(`Création refusée : ${err?.message ?? "aucun identifiant renvoyé"}`); return; }
      const next = { ...created, id: Number(data[0].id), hidden: false } as unknown as SupabaseMemberRow;
      setRow(next);
      setSavedSnapshot(JSON.stringify([form, extras]));
      setTab("portraits");
      setNotice("Membre créé. Ajoute maintenant ses portraits.");
      onSaved(next, `${next.name} ajouté`);
    }
  }

  async function onUploaded(field: string, url: string): Promise<string | null> {
    if (!row) return "membre non enregistré";
    const { error: err } = await adminDb.update("fighters", row.id, { [field]: url });
    if (err) return err.message;
    const next = { ...row, [field]: url } as SupabaseMemberRow;
    setRow(next);
    onSaved(next, `Portrait de ${next.name} mis à jour`);
    return null;
  }

  async function toggleHidden() {
    if (!row) return;
    const hidden = !(row.hidden === true);
    const { error: err } = await adminDb.update("fighters", row.id, { hidden });
    if (err) { setError(`Impossible de ${hidden ? "masquer" : "réafficher"} : ${err.message}`); return; }
    const next = { ...row, hidden };
    setRow(next);
    onSaved(next, `${row.name} ${hidden ? "masqué" : "réaffiché"}`);
  }

  async function remove() {
    if (!row) return;
    const { error: err } = await adminDb.remove("fighters", row.id);
    if (err) { setError(`Suppression refusée : ${err.message}`); setConfirmDelete(false); return; }
    onDeleted(row.id, row.name);
  }

  const setFocus = (key: "photoFocus" | "animeFocus") => (f: FocusPoint | undefined) => patchExtras({ [key]: f });
  const countryOptions = useMemo(() => [...COUNTRIES].sort((a, b) => a.label.localeCompare(b.label, "fr")), []);
  const fieldErr = (k: keyof Identity) => (touched || form[k] !== toIdentity(row)[k]) && errors[k];

  return createPortal(
    <div className="am am-back" onClick={(e) => { if (e.target === e.currentTarget) requestClose(); }}>
      <div ref={sheetRef} className="am-sheet" role="dialog" aria-modal="true" aria-labelledby="am-title">
        <div className="am-head">
          <h2 id="am-title"><small>{isNew ? "Nouveau membre" : `Membre n° ${row!.id}${row!.hidden ? " · masqué" : ""}`}</small>{form.name || "Sans nom"}</h2>
          {row && <a className="am-icon" href={`/membres/${row.id}`} target="_blank" rel="noopener noreferrer" aria-label="Voir la fiche publique (nouvel onglet)"><ExternalLink size={18} aria-hidden="true" /></a>}
          <button type="button" className="am-icon" onClick={requestClose} aria-label="Fermer l'éditeur"><X size={20} aria-hidden="true" /></button>
        </div>

        <div className="am-tabs" role="tablist">
          {([["identite", "Identité"], ["portraits", "Portraits"], ["univers", "Univers"]] as const).map(([k, label]) => (
            <button key={k} type="button" role="tab" className="am-tab" aria-selected={tab === k} disabled={isNew && k !== "identite"}
              title={isNew && k !== "identite" ? "Enregistre d'abord le membre" : undefined} onClick={() => { setTab(k); setError(null); setNotice(null); }}>{label}</button>
          ))}
        </div>

        <div className="am-body">
          {error && <p className="am-alert am-alert--error" role="alert">{error}</p>}
          {notice && <p className="am-alert am-alert--ok" role="status">{notice}</p>}

          {tab === "identite" && (
            <>
              <label className="am-field">
                <span>Nom affiché <b>*</b></span>
                <input className="am-input" value={form.name} maxLength={80} autoComplete="off" aria-invalid={!!fieldErr("name")} onChange={(e) => set("name", e.target.value)} />
                {fieldErr("name") && <small style={{ color: "var(--am-red)" }}>{errors.name}</small>}
              </label>
              <div className="am-grid2">
                <label className="am-field">
                  <span>Grade <b>*</b></span>
                  <select className="am-input" value={form.rank} onChange={(e) => set("rank", e.target.value as Rank)}>
                    {RANK_FILTER_ORDER.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </label>
                {!extrasSupported && (
                <label className="am-field">
                  <span>Distinction</span>
                  <input className="am-input" value={form.badge} maxLength={80} placeholder="ex. RECRUE DE L'ANNÉE 2025" aria-invalid={!!fieldErr("badge")} onChange={(e) => set("badge", e.target.value)} />
                  {fieldErr("badge") && <small style={{ color: "var(--am-red)" }}>{errors.badge}</small>}
                </label>
                )}
                <label className="am-field">
                  <span>Anniversaire</span>
                  <input className="am-input" value={form.birthday} maxLength={40} placeholder="ex. 12 mars" aria-invalid={!!fieldErr("birthday")} onChange={(e) => set("birthday", e.target.value)} />
                  <small>{fieldErr("birthday") || "Jour et mois en toutes lettres, comme sur le site."}</small>
                </label>
                <label className="am-field">
                  <span>Pays</span>
                  <select className="am-input" value={form.country} onChange={(e) => set("country", e.target.value)}>
                    <option value="">Non renseigné</option>
                    {countryOptions.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                  </select>
                </label>
              </div>
              <div className="am-field">
                <span>Couleur de la fiche</span>
                <div className="am-color">
                  <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(form.color) ? form.color : "#000000"} onChange={(e) => set("color", e.target.value.toUpperCase())} aria-label="Choisir la couleur" />
                  <input className="am-input" value={form.color} maxLength={7} aria-label="Code couleur" aria-invalid={!!fieldErr("color")} onChange={(e) => set("color", e.target.value)} />
                </div>
                {fieldErr("color") && <small style={{ color: "var(--am-red)" }}>{errors.color}</small>}
              </div>
              <label className="am-field">
                <span>Présentation</span>
                <textarea className="am-input" value={form.bio} maxLength={1200} aria-invalid={!!fieldErr("bio")} onChange={(e) => set("bio", e.target.value)} />
                <small>{fieldErr("bio") || `${form.bio.length} / 1200`}</small>
              </label>

              {extrasSupported ? (
                <AwardsEditor awards={extras.awards ?? []} onChange={(awards) => patchExtras({ awards })} />
              ) : (
                <p className="am-alert am-alert--info">Le <b>palmarès à plusieurs distinctions</b> s&apos;active après la migration « extras ». En attendant, la distinction unique ci-dessus reste utilisée.</p>
              )}

              {row && (
                <div className="am-section">
                  <h3>Visibilité</h3>
                  <div className="am-row">
                    <button type="button" className="am-btn" onClick={toggleHidden}>
                      {row.hidden ? <><Eye size={16} aria-hidden="true" /> Réafficher sur le site</> : <><EyeOff size={16} aria-hidden="true" /> Masquer du site</>}
                    </button>
                    {!confirmDelete ? (
                      <button type="button" className="am-btn am-btn--danger" onClick={() => setConfirmDelete(true)}><Trash2 size={16} aria-hidden="true" /> Supprimer</button>
                    ) : (
                      <>
                        <button type="button" className="am-btn am-btn--danger" onClick={remove}>Confirmer la suppression définitive</button>
                        <button type="button" className="am-btn" onClick={() => setConfirmDelete(false)}>Annuler</button>
                      </>
                    )}
                  </div>
                  <p>Masquer retire le membre du site sans rien effacer. La suppression est définitive (les photos restent dans le stockage).</p>
                </div>
              )}
            </>
          )}

          {tab === "portraits" && row && (
            <>
              {!extrasSupported && (
                <p className="am-alert am-alert--info">Le <b>cadrage</b> sera disponible après la migration de la base (colonne « extras »). L&apos;envoi et le remplacement des portraits fonctionnent déjà.</p>
              )}
              <div className="am-portraits">
                <PortraitPanel title="Réel" kind="photo" src={row.photo} video={row.photovideo} focus={extras.photoFocus} fallbackFocus="50% 20%"
                  onFocus={setFocus("photoFocus")} canFocus={extrasSupported} member={{ id: row.id, name: row.name }} onUploaded={onUploaded} />
                <PortraitPanel title="Anime" kind="anime" src={row.animechar} video={row.animevideo} focus={extras.animeFocus} fallbackFocus="50% 15%"
                  onFocus={setFocus("animeFocus")} canFocus={extrasSupported} member={{ id: row.id, name: row.name }} onUploaded={onUploaded} />
              </div>
            </>
          )}

          {tab === "univers" && row && (
            extrasSupported ? (
              <UniverseEditor anime={extras.favoriteAnime ?? []} manga={extras.favoriteManga ?? []} music={extras.music ?? []} alias={extras.displayNameRomaji ?? ""}
                onChange={(p) => patchExtras({
                  ...p,
                  ...(p.favoriteAnime ? { favoriteAnime: p.favoriteAnime.length ? p.favoriteAnime : undefined } : {}),
                  ...(p.favoriteManga ? { favoriteManga: p.favoriteManga.length ? p.favoriteManga : undefined } : {}),
                  ...(p.music ? { music: p.music.length ? p.music : undefined } : {}),
                  ...(p.displayNameRomaji !== undefined ? { displayNameRomaji: p.displayNameRomaji || undefined } : {}),
                })} />
            ) : (
              <p className="am-alert am-alert--info">Les <b>anime et mangas préférés</b>, la <b>musique</b> et le surnom en rōmaji seront modifiables ici après la migration de la base (ajout de la colonne « extras »). Aucune donnée existante n&apos;est touchée par cette migration.</p>
            )
          )}
        </div>

        <div className="am-foot">
          <button type="button" className="am-btn" onClick={requestClose}>Fermer</button>
          <button type="button" className="am-btn am-btn--gold" onClick={save} disabled={saving || (!dirty && !isNew)}>
            {saving ? "Enregistrement…" : isNew ? "Créer le membre" : dirty ? "Enregistrer" : "Enregistré"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
