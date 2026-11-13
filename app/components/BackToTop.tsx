"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/** Apparaît après deux écrans de défilement, uniquement quand on remonte. */
export default function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setShow(y > window.innerHeight * 2 && y < last);
        last = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;
  return (
    <button
      type="button"
      className="gk-top"
      aria-label="Revenir en haut de la page"
      onClick={() => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      }}
    >
      <ArrowUp size={20} aria-hidden="true" />
    </button>
  );
}
