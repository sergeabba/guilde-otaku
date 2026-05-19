"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { Rank, type Member } from "../../data/members";
import "./fighters.css";
import { KofLoadingScreen, KofCharacterSelect, KofFightIntro, type ViewMode } from "./kof-ui";
import Arena from "./Arena";

type Phase = "select" | "intro" | "fight";

/* ═══════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════ */
export default function FightersPage() {
  const [members, setMembers]   = useState<Member[]>([]);
  const [loading, setLoading]   = useState(true);
  const [mode, setMode]         = useState<ViewMode>("anime");
  const [selected, setSelected] = useState<Member | null>(null);
  const [phase, setPhase]       = useState<Phase>("select");
  const [fightData, setFightData] = useState<{ p1: Member; p2: Member } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.from("fighters").select("*").order("id", { ascending: true });
        if (error) throw new Error(error.message);
        if (data && !cancelled) {
          setMembers(data.map((m: Record<string, unknown>) => ({
            id: m.id as number,
            name: m.name as string,
            rank: m.rank as Rank,
            birthday: (m.birthday as string) ?? "",
            bio: (m.bio as string) ?? "",
            photo: (m.photo as string) ?? "",
            animeChar: (m.animechar as string) ?? "",
            color: (m.color as string) ?? "#c9a84c",
            badge: m.badge as string | undefined,
            rankJP: m.rankjp as string | undefined,
            stats: (m.stats as { force: number; vitesse: number; technique: number }) ?? { force: 80, vitesse: 80, technique: 80 },
            special: (m.special as { name: string; effect: string }) ?? { name: "Inconnu", effect: "" },
            photoVideo: (m.photovideo as string) ?? "",
            animeVideo: (m.animevideo as string) ?? "",
          })));
        }
      } catch {
        try {
          const { members: lm } = await import("../../data/members");
          if (!cancelled) setMembers(lm);
        } catch { /* */ }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const startFight = useCallback((p1: Member, p2: Member) => {
    setFightData({ p1, p2 });
    setPhase("intro");
  }, []);

  const handleSelect = useCallback((m: Member) => {
    if (selected?.id === m.id) {
      setSelected(null);
    } else if (!selected) {
      setSelected(m);
    } else {
      const p1 = selected;
      setSelected(null);
      startFight(p1, m);
    }
  }, [selected, startFight]);

  const handleFight = useCallback((fighter: Member) => {
    const others = members.filter(m => m.id !== fighter.id);
    if (others.length) {
      const random = others[Math.floor(Math.random() * others.length)];
      setSelected(null);
      startFight(fighter, random);
    }
  }, [members, startFight]);

  const handleExit = useCallback(() => {
    setFightData(null);
    setSelected(null);
    setPhase("select");
  }, []);

  if (loading) return <KofLoadingScreen />;

  return (
    <>
      {phase === "select" && (
        <div style={{ height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <KofCharacterSelect
            members={members}
            mode={mode}
            setMode={setMode}
            selected={selected}
            onSelect={handleSelect}
            onFight={handleFight}
          />
        </div>
      )}
      {phase === "intro" && fightData && (
        <KofFightIntro p1={fightData.p1} p2={fightData.p2} mode={mode} onFinish={() => setPhase("fight")} />
      )}
      {phase === "fight" && fightData && (
        <Arena p1={fightData.p1} p2={fightData.p2} mode={mode} onExit={handleExit} />
      )}
    </>
  );
}
