"use client";

import { useRef, useState } from "react";
import { Upload, RotateCcw } from "lucide-react";
import type { FocusPoint } from "../../lib/member-extras";
import { objectPosition } from "../../lib/member-extras";
import { uploadPortrait } from "../../lib/admin-upload-client";
import type { UploadKind } from "../../lib/admin-upload";

const STEP_LABEL = { compression: "Préparation de l'image…", autorisation: "Autorisation…", envoi: "Envoi en cours…" } as const;

/**
 * Un portrait (réel ou anime) : remplacement du fichier et point de cadrage.
 * Le fichier est enregistré dès l'envoi ; le cadrage est enregistré avec le bouton de l'onglet.
 */
export default function PortraitPanel({ title, kind, src, video, focus, fallbackFocus, onFocus, canFocus, member, onUploaded }: {
  title: string;
  kind: "photo" | "anime";
  src: string;
  video?: string | null;
  focus: FocusPoint | undefined;
  fallbackFocus: string;
  onFocus: (f: FocusPoint | undefined) => void;
  canFocus: boolean;
  member: { id: number; name: string };
  onUploaded: (field: string, url: string) => Promise<string | null>;
}) {
  const [step, setStep] = useState<keyof typeof STEP_LABEL | "save" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [, redraw] = useState(0); // repositionne le repère une fois l'image chargée
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const pos = objectPosition(focus, fallbackFocus);

  async function send(file: File | undefined, uploadKind: UploadKind) {
    if (!file) return;
    setError(null); setOk(null);
    try {
      const { publicUrl, field } = await uploadPortrait(file, { kind: uploadKind, memberId: member.id, memberName: member.name }, setStep);
      setStep("save");
      const err = await onUploaded(field, publicUrl);
      if (err) throw new Error(`Fichier envoyé, mais la fiche n'a pas été mise à jour : ${err}`);
      setOk(uploadKind.endsWith("video") ? "Vidéo enregistrée." : "Portrait enregistré. L'ancien fichier reste dans le stockage.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Envoi impossible");
    } finally {
      setStep(null);
      if (fileRef.current) fileRef.current.value = "";
      if (videoRef.current) videoRef.current.value = "";
    }
  }

  // Point de cadrage : position dans l'image affichée en entier (object-fit: contain).
  function pick(e: React.PointerEvent<HTMLDivElement>) {
    if (!canFocus || !boxRef.current) return;
    const img = boxRef.current.querySelector("img");
    if (!img || !img.naturalWidth) return;
    const box = boxRef.current.getBoundingClientRect();
    const scale = Math.min(box.width / img.naturalWidth, box.height / img.naturalHeight);
    const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
    const left = box.left + (box.width - w) / 2, top = box.top + (box.height - h) / 2;
    const x = Math.round(Math.min(100, Math.max(0, ((e.clientX - left) / w) * 100)));
    const y = Math.round(Math.min(100, Math.max(0, ((e.clientY - top) / h) * 100)));
    onFocus({ x, y });
  }

  const dot = (() => {
    if (!focus || !boxRef.current) return null;
    const img = boxRef.current.querySelector("img");
    if (!img || !img.naturalWidth) return null;
    const box = boxRef.current.getBoundingClientRect();
    const scale = Math.min(box.width / img.naturalWidth, box.height / img.naturalHeight);
    const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
    return { left: (box.width - w) / 2 + (focus.x / 100) * w, top: (box.height - h) / 2 + (focus.y / 100) * h };
  })();

  const busy = step !== null;
  // Formats réels des emplacements : fiche (3:4,2), carte (486x860), annuaire (2:3), aperçu WhatsApp (300x630).
  const previews = [
    { label: "Fiche", ratio: "3 / 4.2" },
    { label: "Carte", ratio: "486 / 860" },
    { label: "Annuaire", ratio: "2 / 3" },
    { label: "WhatsApp", ratio: "300 / 630" },
  ];

  return (
    <div className="am-portrait">
      <h4>{title}</h4>

      <div
        ref={boxRef}
        className="am-focus"
        role={canFocus && src ? "slider" : undefined}
        aria-label={canFocus && src ? `Point de cadrage du portrait ${title.toLowerCase()} : touche ou fais glisser sur le visage` : undefined}
        aria-valuetext={focus ? `${focus.x} % horizontal, ${focus.y} % vertical` : "cadrage automatique"}
        tabIndex={canFocus && src ? 0 : -1}
        onPointerDown={(e) => { if (!src) return; dragging.current = true; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); pick(e); }}
        onPointerMove={(e) => { if (dragging.current) pick(e); }}
        onPointerUp={() => { dragging.current = false; }}
        onKeyDown={(e) => {
          if (!canFocus || !src) return;
          const f = focus ?? { x: 50, y: 20 };
          const d = e.shiftKey ? 10 : 2;
          const next = { ArrowLeft: { ...f, x: f.x - d }, ArrowRight: { ...f, x: f.x + d }, ArrowUp: { ...f, y: f.y - d }, ArrowDown: { ...f, y: f.y + d } }[e.key];
          if (next) { e.preventDefault(); onFocus({ x: Math.min(100, Math.max(0, next.x)), y: Math.min(100, Math.max(0, next.y)) }); }
        }}
        style={{ cursor: canFocus && src ? "crosshair" : "default" }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={`Portrait ${title.toLowerCase()} actuel`} onLoad={() => redraw((n) => n + 1)} />
        ) : (
          <div className="am-focus-empty">Aucun portrait<br />Ajoute une image ci-dessous</div>
        )}
        {dot && <span className="am-focus-dot" style={{ left: dot.left, top: dot.top }} aria-hidden="true" />}
      </div>

      {src && canFocus && (
        <div className="am-row">
          <small style={{ font: "500 0.82rem var(--am-body)", color: "var(--am-faint)", flex: 1 }}>
            {focus ? `Cadrage : ${focus.x} % / ${focus.y} %` : "Cadrage automatique (haut du visage)"} · touche le visage pour centrer
          </small>
          {focus && (
            <button type="button" className="am-btn am-btn--sm" onClick={() => onFocus(undefined)}>
              <RotateCcw size={14} aria-hidden="true" /> Automatique
            </button>
          )}
        </div>
      )}

      {src && (
        <div className="am-previews" aria-label="Aperçu du cadrage">
          {previews.map((p) => (
            <div key={p.label} className="am-prev">
              <div style={{ aspectRatio: p.ratio }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" style={{ objectPosition: p.label === "Annuaire" && !focus ? "50% 0%" : pos }} />
              </div>
              <span>{p.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="am-row">
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden onChange={(e) => send(e.target.files?.[0], kind)} />
        <input ref={videoRef} type="file" accept="video/mp4,video/webm,video/quicktime" hidden onChange={(e) => send(e.target.files?.[0], kind === "photo" ? "photovideo" : "animevideo")} />
        <button type="button" className="am-btn am-btn--gold" disabled={busy} onClick={() => fileRef.current?.click()}>
          <Upload size={16} aria-hidden="true" /> {src ? "Remplacer l'image" : "Ajouter une image"}
        </button>
        <button type="button" className="am-btn am-btn--sm" disabled={busy} onClick={() => videoRef.current?.click()}>
          {video ? "Remplacer la vidéo" : "Ajouter une vidéo"}
        </button>
      </div>
      {video && <small style={{ font: "500 0.8rem var(--am-body)", color: "var(--am-faint)" }}>Vidéo animée en place (affichée à la place de l&apos;image quand elle existe).</small>}

      <div aria-live="polite">
        {step && <p className="am-progress">{step === "save" ? "Mise à jour de la fiche…" : STEP_LABEL[step]}</p>}
        {error && <p className="am-alert am-alert--error">{error}</p>}
        {ok && <p className="am-alert am-alert--ok">{ok}</p>}
      </div>
    </div>
  );
}
