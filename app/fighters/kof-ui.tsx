"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ArrowLeft, Dices, Zap } from "lucide-react";
import VideoPlayer from "../components/VideoPlayer";
import { Rank, RANK_FILTER_ORDER, type Member } from "../../data/members";
import { rankAccents } from "../config/ranks";
import "./fighters.css";

export type ViewMode = "anime" | "real";

const rc = (rank: string) => {
  const main = rankAccents[rank as Rank] ?? rankAccents.Tous;
  return { main, bg: `${main}22`, glow: `${main}88` };
};

const pwr = (m: Member) => {
  const s = m.stats ?? { force: 80, vitesse: 80, technique: 80 };
  return Math.round((s.force + s.vitesse + s.technique) / 3);
};

const portrait = (m: Member, mode: ViewMode) => (mode === "anime" ? m.animeChar : m.photo);
const videoSrc = (m: Member, mode: ViewMode) => (mode === "anime" ? (m.animeVideo ?? "") : (m.photoVideo ?? ""));

/* ─── LOADING ─── */
export function KofLoadingScreen() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPct(v => Math.min(100, v + Math.random() * 7 + 3)), 90);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div className="kof-loading" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="kof-fx kof-fx--scan" aria-hidden />
      <div className="kof-loading-box">
        <pre className="kof-loading-pre">{"╔══════════════════╗\n║  GUILDE FIGHTERS ║\n╚══════════════════╝"}</pre>
        <div className="kof-loading-title">NOW LOADING</div>
        <div className="kof-loading-sub">★ PLAYER DATA ★</div>
      </div>
      <div className="kof-loading-bar">
        <motion.div className="kof-loading-fill" style={{ width: `${pct}%` }} />
      </div>
    </motion.div>
  );
}

function KofStatBar({ label, value, color, delay = 0 }: { label: string; value: number; color: string; delay?: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div className="kof-stat-row">
      <span className="kof-stat-label">{label}</span>
      <div className="kof-stat-track">
        <motion.div className="kof-stat-fill" initial={{ width: 0 }} animate={{ width: show ? `${value}%` : 0 }} transition={{ duration: 0.6 }} style={{ background: color }} />
      </div>
      <span className="kof-stat-val" style={{ color }}>{value}</span>
    </div>
  );
}

function FighterSidePanel({ side, member, mode, waitingText }: { side: "p1" | "p2"; member: Member | null; mode: ViewMode; waitingText: string }) {
  const c = member ? rc(member.rank) : null;
  const s = member?.stats ?? { force: 80, vitesse: 80, technique: 80 };
  const vid = member ? videoSrc(member, mode) : "";
  const img = member ? portrait(member, mode) : "";

  return (
    <div className={`kof-side kof-side--${side}`}>
      <div className="kof-side-label">{side === "p1" ? "1P SELECT" : "2P SELECT"}</div>
      <AnimatePresence mode="wait">
        {member && c ? (
          <motion.div key={member.id} className="flex flex-col flex-1 min-h-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="kof-side-portrait">
              {vid ? (
                <motion.div style={{ width: "100%", height: "100%", filter: `drop-shadow(0 0 32px ${c.glow})` }}>
                  <VideoPlayer src={vid} fit="contain" objectPosition="bottom" fullscreenBtn={false} />
                </motion.div>
              ) : img ? (
                <Image src={img} alt={member.name} width={320} height={420} style={{ maxHeight: "100%", width: "auto", objectFit: "contain", objectPosition: "bottom", filter: `drop-shadow(0 0 32px ${c.glow})` }} />
              ) : (
                <span className="kof-side-empty-char">?</span>
              )}
            </div>
            <div className="kof-side-meta">
              <motion.div className="kof-side-name" style={{ color: c.main }}>{member.name.toUpperCase()}</motion.div>
              <motion.div className="kof-side-rank" style={{ color: c.main }}>{member.rank.toUpperCase()}</motion.div>
              <motion.div className="kof-side-pwr" style={{ color: c.main }}>PWR {pwr(member)}</motion.div>
              <KofStatBar label="FOR" value={s.force} color="#ef4444" delay={0} />
              <KofStatBar label="VIT" value={s.vitesse} color="#38bdf8" delay={80} />
              <KofStatBar label="TEC" value={s.technique} color="#a78bfa" delay={160} />
            </div>
          </motion.div>
        ) : (
          <motion.div key="empty" className="kof-side-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <span className="kof-side-empty-char">?</span>
            <span className="kof-side-empty-text">{waitingText}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function KofFighterTile({
  member, mode, isP1, isP2Preview, idx, onSelect, onHover,
}: {
  member: Member; mode: ViewMode; isP1: boolean; isP2Preview: boolean; idx: number;
  onSelect: (m: Member) => void; onHover: (m: Member | null) => void;
}) {
  const vid = videoSrc(member, mode);
  const img = portrait(member, mode);

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min(idx * 0.012, 0.28), duration: 0.18 }}
      onClick={() => onSelect(member)}
      onMouseEnter={() => onHover(member)}
      onMouseLeave={() => onHover(null)}
      className={`kof-tile${isP1 ? " is-p1" : ""}${isP2Preview ? " is-p2-preview" : ""}`}
      whileTap={{ scale: 0.96 }}
    >
      <div className="kof-tile-media">
        {vid ? (
          <VideoPlayer src={vid} fit="cover" objectPosition="smart" fullscreenBtn={false} />
        ) : img ? (
          <Image src={img} alt={member.name} width={140} height={180} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 15%", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", background: "#0a0812" }}>
            <span style={{ fontSize: 24, fontWeight: 900, opacity: 0.2 }}>?</span>
          </div>
        )}
      </div>
      <span className="kof-tile-name">{member.name.toUpperCase()}</span>
    </motion.button>
  );
}

function KofModeToggle({ mode, setMode }: { mode: ViewMode; setMode: (m: ViewMode) => void }) {
  return (
    <div className="kof-mode-toggle">
      {(["real", "anime"] as ViewMode[]).map(m => (
        <button key={m} type="button" onClick={() => setMode(m)} className={`kof-mode-btn${mode === m ? " is-active" : ""}`}>
          {m === "real" ? "RÉEL" : "ANIME"}
        </button>
      ))}
    </div>
  );
}

/* ─── CHARACTER SELECT (KOF '98) ─── */
export function KofCharacterSelect({
  members, mode, setMode, selected, onSelect, onFight,
}: {
  members: Member[]; mode: ViewMode; setMode: (m: ViewMode) => void;
  selected: Member | null; onSelect: (m: Member) => void; onFight: (m: Member) => void;
}) {
  const [filter, setFilter] = useState<Rank | "Tous">("Tous");
  const [hovered, setHovered] = useState<Member | null>(null);
  const filtered = filter === "Tous" ? members : members.filter(m => m.rank === filter);
  const p2Preview = hovered && hovered.id !== selected?.id ? hovered : null;
  const showVs = Boolean(selected && p2Preview);

  return (
    <div className="kof-root">
      <div className="kof-bg-glow" aria-hidden />
      <div className="kof-fx kof-fx--grid" aria-hidden />
      <div className="kof-fx kof-fx--scan" aria-hidden />
      <div className="kof-fx kof-fx--vignette" aria-hidden />

      <header className="kof-topbar">
        <div className="kof-topbar-inner">
          <Link href="/" className="kof-back" aria-label="Retour">
            <ArrowLeft size={18} />
          </Link>
          <div className="kof-logo-block">
            <div className="kof-logo-title">THE KING OF FIGHTERS &apos;98</div>
            <div className="kof-logo-sub">GUILDE OTAKU — TEAM BATTLE</div>
          </div>
          <KofModeToggle mode={mode} setMode={setMode} />
        </div>
        <div className="kof-filters scrollbar-hide">
          {(["Tous", ...RANK_FILTER_ORDER] as (Rank | "Tous")[]).map(r => {
            const accent = r === "Tous" ? rankAccents.Tous : rankAccents[r as Rank];
            return (
              <button
                key={r}
                type="button"
                onClick={() => setFilter(r as Rank | "Tous")}
                className={`kof-filter-btn${filter === r ? " is-active" : ""}`}
                style={{ "--filter-accent": accent } as React.CSSProperties}
              >
                {r}
              </button>
            );
          })}
        </div>
      </header>

      <div className="kof-stage">
        <FighterSidePanel side="p1" member={selected} mode={mode} waitingText="PRESS START — 1P" />
        <div className="kof-roster-wrap">
          <div className="kof-roster-banner">★ CHOOSE YOUR FIGHTER ★</div>
          <div className="kof-roster">
            <div className="kof-roster-grid">
              {filtered.map((m, i) => (
                <KofFighterTile
                  key={m.id}
                  member={m}
                  mode={mode}
                  isP1={selected?.id === m.id}
                  isP2Preview={p2Preview?.id === m.id}
                  idx={i}
                  onSelect={onSelect}
                  onHover={setHovered}
                />
              ))}
              <motion.button
                type="button"
                className="kof-tile kof-tile-random"
                onClick={() => {
                  const pool = selected ? members.filter(m => m.id !== selected.id) : members;
                  if (pool.length) onSelect(pool[Math.floor(Math.random() * pool.length)]);
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
              >
                <Dices size={22} />
                <span>RANDOM</span>
              </motion.button>
            </div>
          </div>
        </div>
        <FighterSidePanel side="p2" member={p2Preview} mode={mode} waitingText={selected ? "SELECT OPPONENT" : "WAITING…"} />
        <div className={`kof-center-vs${showVs ? " is-visible" : ""}`}>VS</div>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div className="kof-cta" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
            <p className="kof-cta-hint">
              {selected.name.toUpperCase()} — 2ND CLICK = DUEL · OR RANDOM MATCH
            </p>
            <motion.button type="button" className="kof-cta-btn" onClick={() => onFight(selected)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Zap size={16} />
              RANDOM BATTLE
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── INTRO: Tekken announce → KOF VS ─── */
type IntroStep = "announce" | "p1" | "vs" | "p2" | "fight";

export function KofFightIntro({ p1, p2, mode, onFinish }: { p1: Member; p2: Member; mode: ViewMode; onFinish: () => void }) {
  const [step, setStep] = useState<IntroStep>("announce");
  const c1 = rc(p1.rank);
  const c2 = rc(p2.rank);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep("p1"), 2200),
      setTimeout(() => setStep("vs"), 3200),
      setTimeout(() => setStep("p2"), 4000),
      setTimeout(() => setStep("fight"), 5200),
      setTimeout(() => onFinish(), 6400),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onFinish]);

  return (
    <motion.div className="kof-intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="kof-fx kof-fx--scan" aria-hidden />

      <AnimatePresence>
        {step === "announce" && (
          <motion.div
            className="kof-intro-announce"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.35 }}
          >
            <motion.p className="kof-tekken-line" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
              GET READY
            </motion.p>
            <motion.p className="kof-tekken-line kof-tekken-line--main" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.25 }}>
              FOR THE NEXT BATTLE
            </motion.p>
            <motion.p className="kof-tekken-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
              {p1.name} vs {p2.name}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {step !== "announce" && (
        <div className="kof-intro-split">
          <motion.div
            className="kof-intro-side kof-intro-side--p1"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            transition={{ type: "spring", stiffness: 65, damping: 14 }}
            style={{ background: `linear-gradient(135deg, ${c1.bg}, #040308)` }}
          >
            {(videoSrc(p1, mode) || portrait(p1, mode)) && (
              <div className="absolute inset-0 flex items-end justify-center pb-16">
                {videoSrc(p1, mode) ? (
                  <div style={{ width: "72%", height: "82%", filter: `drop-shadow(0 0 36px ${c1.glow})` }}>
                    <VideoPlayer src={videoSrc(p1, mode)!} fit="contain" objectPosition="bottom" fullscreenBtn={false} />
                  </div>
                ) : (
                  <Image src={portrait(p1, mode)} alt={p1.name} width={360} height={460} style={{ width: "72%", height: "82%", objectFit: "contain", objectPosition: "bottom", filter: `drop-shadow(0 0 36px ${c1.glow})` }} />
                )}
              </div>
            )}
            <div className="kof-intro-name kof-intro-name--p1">
              <div className="kof-intro-tag" style={{ color: c1.main }}>PLAYER 1</div>
              {p1.name.toUpperCase()}
            </div>
          </motion.div>

          <AnimatePresence>
            {["p2", "fight"].includes(step) && (
              <motion.div
                className="kof-intro-side kof-intro-side--p2"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                transition={{ type: "spring", stiffness: 65, damping: 14 }}
                style={{ background: `linear-gradient(225deg, ${c2.bg}, #040308)` }}
              >
                {(videoSrc(p2, mode) || portrait(p2, mode)) && (
                  <div className="absolute inset-0 flex items-end justify-center pb-16">
                    {videoSrc(p2, mode) ? (
                      <div style={{ width: "72%", height: "82%", filter: `drop-shadow(0 0 36px ${c2.glow})`, transform: "scaleX(-1)" }}>
                        <VideoPlayer src={videoSrc(p2, mode)!} fit="contain" objectPosition="bottom" fullscreenBtn={false} />
                      </div>
                    ) : (
                      <Image src={portrait(p2, mode)} alt={p2.name} width={360} height={460} style={{ width: "72%", height: "82%", objectFit: "contain", objectPosition: "bottom", filter: `drop-shadow(0 0 36px ${c2.glow})`, transform: "scaleX(-1)" }} />
                    )}
                  </div>
                )}
                <div className="kof-intro-name kof-intro-name--p2">
                  <div className="kof-intro-tag" style={{ color: c2.main }}>PLAYER 2</div>
                  {p2.name.toUpperCase()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {step === "vs" && (
          <motion.div className="kof-intro-vs" initial={{ scale: 4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={{ type: "spring", stiffness: 180, damping: 14 }}>
            VS
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {step === "fight" && (
          <motion.div className="kof-intro-fight" initial={{ scale: 3.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 200, damping: 16 }}>
            FIGHT!
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
