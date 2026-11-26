"use client";

// Bascule anime / réel, présente partout : un seul réglage pour tout le site.
import { setFace, useFace } from "../../lib/face";
import "./face-toggle.css";

export default function FaceToggle({ className = "" }: { className?: string }) {
  const face = useFace();
  return (
    <div className={`face-toggle ${className}`} role="group" aria-label="Portraits">
      <button type="button" aria-pressed={face === "anime"} onClick={() => setFace("anime")}>Anime</button>
      <button type="button" aria-pressed={face === "real"} onClick={() => setFace("real")}>Réel</button>
    </div>
  );
}
