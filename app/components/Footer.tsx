import Link from "next/link";
import { NAV_ORDER, navEntry, chapterNo } from "../config/nav";
import { NavGlyph } from "./GuildeHeader";
import ReplayIntro from "./ReplayIntro";
import SoundToggle from "./SoundToggle";

export default function Footer() {
  return (
    <footer className="gk-footer">
      <div
        className="gk-speed"
        aria-hidden="true"
        style={{ position: "absolute", inset: "-40% -10%", opacity: 0.5, pointerEvents: "none" }}
      />
      <div className="gk-wrap">
        <div className="gk-footer-grid">
          <p className="gk-footer-title">
            À suivre<span>...</span>
            <span
              className="gk-jp"
              aria-hidden="true"
              style={{ display: "block", fontSize: "0.9rem", marginTop: 10, color: "rgba(243,238,226,0.5)" }}
            >
              Tsuzuku
            </span>
          </p>
          <nav aria-label="Toutes les rubriques">
            {NAV_ORDER.map((id, i) => { const l = navEntry(id); return (
              <Link key={l.id} href={l.href}>
                <b aria-hidden="true">{chapterNo(i)}</b>
                <NavGlyph id={l.id} />
                {l.label}
              </Link>
            ); })}
          </nav>
        </div>
        <div className="gk-footer-base">
          <span>&copy; 2020-{new Date().getFullYear()} Guilde Otaku. Fait par la Guilde, pour la Guilde.</span>
          <span>Les œuvres citées appartiennent à leurs ayants droit.</span>
          <ReplayIntro />
          <SoundToggle />
        </div>
      </div>
    </footer>
  );
}
