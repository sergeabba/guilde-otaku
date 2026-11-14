"use client";

// Briques communes de l'administration : confirmation précise, notifications,
// état d'enregistrement, garde « modifications non enregistrées », barre de liste.
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Search, X } from "lucide-react";

// ─── Confirmation ────────────────────────────────────────────────────────────
export interface ConfirmOptions {
  title: string;
  /** Ce qui va se passer exactement (objet, conséquences, caractère définitif). */
  body: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
}

/** Renvoie `confirm(options) → Promise<boolean>` et l'élément de dialogue à rendre. */
export function useConfirm(): [(o: ConfirmOptions) => Promise<boolean>, React.ReactNode] {
  const [state, setState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
  const confirm = useCallback((o: ConfirmOptions) => new Promise<boolean>((resolve) => setState({ ...o, resolve })), []);
  const close = (v: boolean) => { state?.resolve(v); setState(null); };
  const node = state ? <ConfirmDialog {...state} onCancel={() => close(false)} onConfirm={() => close(true)} /> : null;
  return [confirm, node];
}

function ConfirmDialog({ title, body, confirmLabel, cancelLabel = "Annuler", danger, onCancel, onConfirm }: ConfirmOptions & { onCancel: () => void; onConfirm: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    // Focus sur « Annuler » : une validation par erreur au clavier n'efface rien.
    ref.current?.querySelector<HTMLButtonElement>("[data-cancel]")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onCancel(); }
      if (e.key === "Tab" && ref.current) {
        const items = [...ref.current.querySelectorAll<HTMLElement>("button")];
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); previous?.focus?.(); };
  }, [onCancel]);
  return (
    <div className="am-dialog-back" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div ref={ref} className="am-dialog" role="alertdialog" aria-modal="true" aria-labelledby="am-dialog-title" aria-describedby="am-dialog-body">
        <div className="am-dialog-head">
          {danger && <AlertTriangle size={22} className="am-dialog-icon" aria-hidden="true" />}
          <h2 id="am-dialog-title">{title}</h2>
        </div>
        <div id="am-dialog-body" className="am-dialog-body">{body}</div>
        <div className="am-dialog-actions">
          <button type="button" className="am-btn" data-cancel onClick={onCancel}>{cancelLabel}</button>
          <button type="button" className={`am-btn ${danger ? "am-btn--danger-solid" : "am-btn--gold"}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Notifications ───────────────────────────────────────────────────────────
type ToastKind = "ok" | "error" | "info";
export function useToast(): [(message: string, kind?: ToastKind) => void, React.ReactNode] {
  const [toasts, setToasts] = useState<{ id: number; message: string; kind: ToastKind }[]>([]);
  const seq = useRef(0);
  const notify = useCallback((message: string, kind: ToastKind = "ok") => {
    const id = ++seq.current;
    setToasts((t) => [...t.slice(-2), { id, message, kind }]);
    // Les erreurs restent jusqu'à fermeture ; les confirmations disparaissent seules.
    if (kind !== "error") setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  const node = (
    <div className="am-toasts" aria-live="polite" aria-relevant="additions">
      {toasts.map((t) => (
        <div key={t.id} className={`am-toast is-${t.kind}`} role={t.kind === "error" ? "alert" : "status"}>
          {t.kind === "error" ? <AlertTriangle size={18} aria-hidden="true" /> : <CheckCircle2 size={18} aria-hidden="true" />}
          <span>{t.message}</span>
          <button type="button" className="am-toast-x" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} aria-label="Fermer le message"><X size={16} aria-hidden="true" /></button>
        </div>
      ))}
    </div>
  );
  return [notify, node];
}

// ─── État d'enregistrement ───────────────────────────────────────────────────
export type SaveState = { kind: "idle" } | { kind: "dirty" } | { kind: "saving" } | { kind: "saved"; at: number } | { kind: "error"; message: string };

export function SaveStatus({ state }: { state: SaveState }) {
  const label = state.kind === "dirty" ? "Modifications non enregistrées"
    : state.kind === "saving" ? "Enregistrement…"
      : state.kind === "saved" ? `Enregistré à ${new Date(state.at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
        : state.kind === "error" ? `Erreur : ${state.message}` : "À jour";
  return (
    <p className={`am-status is-${state.kind}`} role={state.kind === "error" ? "alert" : "status"} aria-live="polite">
      {state.kind === "saving" ? <Loader2 size={15} className="am-spin" aria-hidden="true" /> : <span className="am-status-dot" aria-hidden="true" />}
      {label}
    </p>
  );
}

// ─── Garde de sortie ─────────────────────────────────────────────────────────
/**
 * Prévient avant de quitter une page avec des modifications non enregistrées :
 * fermeture de l'onglet (alerte du navigateur) et liens internes (dialogue précis).
 */
export function useUnsavedGuard(dirty: boolean, confirm: (o: ConfirmOptions) => Promise<boolean>) {
  useEffect(() => {
    if (!dirty) return;
    const onBefore = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || (url.pathname === location.pathname && url.hash)) return;
      e.preventDefault(); e.stopPropagation();
      confirm({
        title: "Quitter sans enregistrer ?",
        body: "Tes modifications en cours seront perdues. Enregistre d'abord si tu veux les garder.",
        confirmLabel: "Quitter sans enregistrer", cancelLabel: "Rester sur la page", danger: true,
      }).then((ok) => { if (ok) { window.removeEventListener("beforeunload", onBefore); location.href = url.href; } });
    };
    window.addEventListener("beforeunload", onBefore);
    document.addEventListener("click", onClick, true);
    return () => { window.removeEventListener("beforeunload", onBefore); document.removeEventListener("click", onClick, true); };
  }, [dirty, confirm]);
}

// ─── Barre de liste ──────────────────────────────────────────────────────────
export function ListToolbar({ query, onQuery, placeholder, count, total, children }: {
  query: string; onQuery: (q: string) => void; placeholder: string; count: number; total: number; children?: React.ReactNode;
}) {
  return (
    <div className="am-toolbar">
      <label className="am-search-field">
        <Search size={17} aria-hidden="true" />
        <input type="search" value={query} onChange={(e) => onQuery(e.target.value)} placeholder={placeholder} aria-label={placeholder} autoComplete="off" spellCheck={false} />
        {query && <button type="button" onClick={() => onQuery("")} aria-label="Effacer la recherche"><X size={16} aria-hidden="true" /></button>}
      </label>
      {children && <div className="am-chips" role="group" aria-label="Filtres">{children}</div>}
      <p className="am-count" aria-live="polite">{count === total ? `${total} élément${total > 1 ? "s" : ""}` : `${count} sur ${total}`}</p>
    </div>
  );
}

export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" className="am-chip" aria-pressed={active} onClick={onClick}>{children}</button>;
}

/** Normalisation pour la recherche (accents et casse ignorés). */
export const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

// ─── Panneau d'édition (même forme que l'éditeur de membre) ──────────────────
/**
 * Panneau latéral (plein écran sur téléphone) : en-tête, contenu défilant, pied fixe
 * avec les boutons. Fermer avec des modifications non enregistrées demande confirmation.
 */
export function EditorSheet({ kicker, title, dirty, onClose, footer, children, confirm }: {
  kicker: string; title: string; dirty: boolean; onClose: () => void; footer: React.ReactNode; children: React.ReactNode;
  confirm: (o: ConfirmOptions) => Promise<boolean>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const requestClose = useCallback(async () => {
    if (dirty && !(await confirm({ title: "Fermer sans enregistrer ?", body: <>Les modifications de <strong>{title}</strong> ne sont pas enregistrées et seront perdues.</>, confirmLabel: "Fermer sans enregistrer", cancelLabel: "Continuer l'édition", danger: true }))) return;
    onClose();
  }, [dirty, confirm, title, onClose]);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.querySelector<HTMLElement>("input, textarea, select, button")?.focus();
    return () => { document.body.style.overflow = prev; };
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !document.querySelector(".am-dialog")) void requestClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestClose]);
  return (
    <div className="am am-back" onClick={(e) => { if (e.target === e.currentTarget) void requestClose(); }}>
      <div ref={ref} className="am-sheet" role="dialog" aria-modal="true" aria-labelledby="am-sheet-title">
        <div className="am-head">
          <h2 id="am-sheet-title"><small>{kicker}</small>{title}</h2>
          <button type="button" className="am-icon" onClick={() => void requestClose()} aria-label="Fermer"><X size={20} aria-hidden="true" /></button>
        </div>
        <div className="am-body">{children}</div>
        <div className="am-foot">{footer}</div>
      </div>
    </div>
  );
}
