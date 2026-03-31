"use client";

// ─── app/components/BirthdayBanner.tsx ───────────────────────────────────────
// Affiche une bannière le jour de l'anniversaire d'un ou plusieurs membres.
// parseBirthday centralisé dans app/types pour éviter la duplication.

import { useEffect, useState } from "react";
import { members } from "../../data/members";
import Link from "next/link";
import { Gift, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { parseBirthday } from "../types"; // ← centralisé

export default function BirthdayBanner() {
  const [birthdayMembers, setBirthdayMembers] = useState<typeof members>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const now = new Date();
    const todayDay = now.getDate();
    const todayMonth = now.getMonth() + 1;

    const celebrating = members.filter((m) => {
      const parsed = parseBirthday(m.birthday);
      return parsed && parsed.day === todayDay && parsed.month === todayMonth;
    });

    setBirthdayMembers(celebrating);
  }, []);

  if (birthdayMembers.length === 0) return null;

  // Prénom uniquement pour la bannière
  const names = birthdayMembers
    .map((m) => m.name.split(" ")[0])
    .join(" & ");

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{ overflow: "hidden", position: "relative", zIndex: 9999 }}
        >
          <div
            className="animate-gradient"
            style={{
              background:
                "linear-gradient(90deg, #f03e3e, #ec4899, #f03e3e)",
              backgroundSize: "200% auto",
              color: "#fff",
              padding: "0 56px 0 20px", // padding droit pour le bouton X
              height: "44px",           // hauteur fixe = touch target
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 15px rgba(240, 62, 62, 0.4)",
            }}
          >
            <Link
              href="/birthdays"
              style={{
                textDecoration: "none",
                color: "inherit",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
                justifyContent: "center",
                // Annule le min-height du reset globals.css pour ce lien inline
                minHeight: "unset",
                minWidth: "unset",
              }}
            >
              <Gift size={16} />
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontFamily: "'Barlow Condensed', sans-serif",
                }}
              >
                C'est l'anniversaire de {names} aujourd'hui !
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
                FÊTER ÇA <ChevronRight size={12} />
              </span>
            </Link>

            {/* ── BOUTON FERMER ── touch target 44×44px ───────────────────── */}
            <button
              onClick={() => setIsVisible(false)}
              aria-label="Fermer la bannière d'anniversaire"
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                // ✅ 44×44px touch target
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
                // Annule le min-height du reset
                minHeight: "unset",
                minWidth: "unset",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "#fff")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "rgba(255,255,255,0.7)")
              }
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}