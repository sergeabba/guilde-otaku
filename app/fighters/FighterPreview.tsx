"use client";

import { useEffect, useRef } from "react";
import { characterFor, sheetFor } from "../../lib/fighters/characters";
import { animationFrame, drawSprite, loadSheet } from "../../lib/fighters/sprites";

/** Le véritable sprite du jeu, et non une image décorative différente du combattant. */
export default function FighterPreview({ memberId, side }: { memberId: number; side: 0 | 1 }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const meta = sheetFor(characterFor(memberId));
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !meta) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const sheet = loadSheet(meta);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    const start = performance.now();
    const draw = (now: number) => {
      ctx.clearRect(0, 0, 160, 120);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.beginPath(); ctx.ellipse(80, 113, 30, 3, 0, 0, Math.PI * 2); ctx.fill();
      if (sheet.ready) drawSprite(ctx, sheet, animationFrame(meta.anims.idle, mq.matches ? 0 : Math.floor((now - start) * 60 / 1000)), 80, 112, side === 0 ? 1 : -1, false);
      if (!sheet.failed) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ctx.clearRect(0, 0, 160, 120); };
  }, [meta, side]);
  if (!meta) return null;
  return <figure className="fxs-preview" aria-label="Aperçu du sprite en combat"><canvas ref={ref} width={160} height={120} aria-hidden="true" /><figcaption>En piste</figcaption></figure>;
}
