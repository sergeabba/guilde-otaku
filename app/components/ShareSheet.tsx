"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, Download, MessageCircle, Share2, X } from "lucide-react";
import type { Member } from "../../data/members";
import { memberCardUrl, memberProfilePath } from "../../lib/share";
import { useShare } from "../hooks/useShare";

type ShareMember = Pick<Member, "id" | "name" | "rank" | "photo" | "animeChar" | "badge" | "color" | "extras">;

/**
 * Partage d'un profil : lien permanent, WhatsApp, carte PNG et partage natif.
 * La carte est générée côté serveur à partir de l'identifiant du membre.
 */
export default function ShareSheet({ member, open, onClose }: { member: ShareMember; open: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<"download" | "share" | null>(null);
  const [cardFailed, setCardFailed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notify, Toast } = useShare();

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.querySelector<HTMLElement>("button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
      if (e.key === "Tab" && ref.current) {
        const items = [...ref.current.querySelectorAll<HTMLElement>("button, a[href]")];
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey, true);
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return <Toast />;

  const profileUrl = `${window.location.origin}${memberProfilePath(member.id)}`;
  const text = `${member.name}, ${member.rank} de la Guilde Otaku`;
  const fileName = `carte-otaku-${member.id}.png`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = profileUrl;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      if (!ok) { notify("Copie impossible : sélectionne le lien à la main"); return; }
    }
    setCopied(true);
    notify("Lien copié");
    setTimeout(() => setCopied(false), 2200);
  };

  const fetchCard = async (): Promise<Blob> => {
    const res = await fetch(memberCardUrl(member));
    if (!res.ok || !res.headers.get("content-type")?.startsWith("image/png")) throw new Error("card");
    return res.blob();
  };

  const download = async () => {
    setBusy("download");
    try {
      const blob = await fetchCard();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      notify("Carte téléchargée");
    } catch {
      notify("La carte n'a pas pu être générée. Réessaie.");
    } finally {
      setBusy(null);
    }
  };

  // Partage natif : avec la carte en pièce jointe quand l'appareil le permet, sinon le lien seul.
  const nativeShare = async () => {
    if (typeof navigator.share !== "function") { copy(); return; }
    setBusy("share");
    try {
      let shared = false;
      try {
        const file = new File([await fetchCard()], fileName, { type: "image/png" });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: text, text: `${text}\n${profileUrl}` });
          shared = true;
        }
      } catch (err) {
        if ((err as DOMException)?.name === "AbortError") return;
      }
      if (!shared) await navigator.share({ title: text, text, url: profileUrl });
    } catch (err) {
      if ((err as DOMException)?.name !== "AbortError") copy();
    } finally {
      setBusy(null);
    }
  };

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${text}\n${profileUrl}`)}`;

  return (
    <>
      {createPortal(
        <div className="sh-back tone-dark" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
          <div ref={ref} className="sh-sheet" role="dialog" aria-modal="true" aria-labelledby="sh-title">
            <div className="sh-head">
              <h2 id="sh-title">Partager la fiche de {member.name}</h2>
              <button type="button" className="gk-icon-btn" onClick={onClose} aria-label="Fermer le partage">
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <div className="sh-preview">
              {cardFailed ? (
                <p className="gk-body">L&apos;aperçu de la carte n&apos;a pas pu être chargé. Le téléchargement réessaiera.</p>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={memberCardUrl(member)} alt={`Carte Otaku de ${member.name} : portrait réel et version anime`} width={1080} height={1350} loading="lazy" onError={() => setCardFailed(true)} />
              )}
            </div>

            <div className="sh-link">
              <input readOnly value={profileUrl} aria-label="Lien permanent de la fiche" onFocus={(e) => e.currentTarget.select()} />
            </div>

            <div className="sh-actions">
              <button type="button" className="gk-btn" onClick={copy}>
                {copied ? <Check size={17} aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}
                {copied ? "Lien copié" : "Copier le lien"}
              </button>
              <a className="gk-btn gk-btn--ghost" href={whatsappHref} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={17} aria-hidden="true" /> WhatsApp<span className="gk-sr"> (nouvel onglet)</span>
              </a>
              <button type="button" className="gk-btn gk-btn--ghost" onClick={download} aria-busy={busy === "download"}>
                <Download size={17} aria-hidden="true" /> {busy === "download" ? "Préparation..." : "Télécharger la carte"}
              </button>
              <button type="button" className="gk-btn gk-btn--ghost" onClick={nativeShare} aria-busy={busy === "share"}>
                <Share2 size={17} aria-hidden="true" /> {busy === "share" ? "Préparation..." : "Partager"}
              </button>
            </div>
            <p className="sh-note">
              Le lien ouvre directement cette fiche. Dans WhatsApp, l&apos;aperçu montre le portrait réel et la version anime.
            </p>
          </div>
        </div>,
        document.body
      )}
      <Toast />
    </>
  );
}
