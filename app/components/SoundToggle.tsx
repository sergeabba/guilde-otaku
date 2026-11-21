"use client";

// Interrupteur des sons d'interface (préférence gardée sur l'appareil).
import { useEffect, useState } from "react";
import { setSounds, soundsOn } from "../../lib/fx";

export default function SoundToggle() {
  const [on, setOn] = useState<boolean | null>(null);
  useEffect(() => {
    void Promise.resolve().then(() => setOn(soundsOn()));
    const sync = (e: Event) => setOn(Boolean((e as CustomEvent<boolean>).detail));
    window.addEventListener("gk:sounds", sync);
    return () => window.removeEventListener("gk:sounds", sync);
  }, []);
  if (on === null) return null;
  return (
    <button type="button" className="gk-footer-replay" aria-pressed={on} onClick={() => setSounds(!on)}>
      Sons de l&apos;interface : {on ? "activés" : "coupés"}
    </button>
  );
}
