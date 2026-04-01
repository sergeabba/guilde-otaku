"use client";

// ─── app/components/BirthdayBanner.tsx ───────────────────────────────────────
// Affiche une bannière le jour de l'anniversaire d'un ou plusieurs membres.
// v2 — Améliorations :
//   1. Typage strict (SupabaseMemberRow au lieu de any[])
//   2. role="alert" + aria-live="polite" pour les lecteurs d'écran
//   3. Optimisation : select("id,name,birthday") au lieu de select("*")
//   4. isTodayBirthday() centralisé depuis app/types
//   5. Gestion d'erreur Supabase explicite

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";
import { Gift, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { isTodayBirthday } from "../types";

// Type minimal pour la bannière (on ne sélectionne que les colonnes nécessaires)
interface BirthdayMember {
  id:       number;
  name:     string;
  birthday: string;
}

export default function BirthdayBanner() {
  const [birthdayMembers, setBirthdayMembers] = useState<BirthdayMember[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const fetchBirthdays = async () => {
      // On ne sélectionne que les colonnes nécessaires → requête plus légère
      const { data, error } = await supabase
        .from("fighters")
        .select("id, name, birthday");

      if (error || !data) return;

      const celebrating = (data as BirthdayMember[]).filter(
        (m) => m.birthday && isTodayBirthday(m.birthday)
      );
      setBirthdayMembers(celebrating);
    };

    fetchBirthdays();
  }, []);

  // Prénom uniquement pour la bannière (plus lisible)
  const names = birthdayMembers
    .map((m) => m.name.split(" ")[0])
    .join(" & ");

  return (
    <AnimatePresence>
      {isVisible && birthdayMembers.length > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{ overflow: "hidden", position: "relative", zIndex: 9999 }}
          // ✅ Accessibilité : annonce la bannière aux lecteurs d'écran
          role="alert"
          aria-live="polite"
          aria-atomic="true"
        >
          <div
            className="animate-gradient"
            style={{
              background: "linear-gradient(90deg, #f03e3e, #ec4899, #f03e3e)",
              backgroundSize: "200% auto",
              color: "#fff",
              padding: "0 56px 0 20px",
              height: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 15px rgba(240, 62, 62, 0.4)",
            }}
          >
            <Link
              href="/birthdays"
              className="no-min"
              style={{
                textDecoration: "none",
                color: "inherit",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <Gift size={16} aria-hidden="true" />
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontFamily: "'Barlow Condensed', sans-serif",
                }}
              >
                🎂 C'est l'anniversaire de{" "}
                <strong>{names}</strong> aujourd'hui !
              </span>
              <span
                style={{
                  background: "rgba(0,0,0,0.2)",
                  padding: "2px 8px",
                  borderRadius: "100px",
                  fontSize: "11px",
                  fontWeight: 900,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontFamily: "'Barlow Condensed', sans-serif",
                }}
              >
                FÊTER ÇA <ChevronRight size={12} aria-hidden="true" />
              </span>
            </Link>

            {/* ── BOUTON FERMER ── touch target 44×44px ───────────────────── */}
            <button
              onClick={() => setIsVisible(false)}
              aria-label="Fermer la bannière d'anniversaire"
              className="no-min"
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                width: "44px",
                height: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: "none",
                color: "rgba(255,255,255,0.7)",
                cursor: "pointer",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
