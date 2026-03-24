"use client";

import { useEffect, useState } from "react";
import { members } from "../../data/members"; // Vérifie que ce chemin est le bon chez toi
import Link from "next/link";
import { Gift, ChevronRight, X } from "lucide-react"; // J'ai ajouté l'icône X ici
import { motion, AnimatePresence } from "framer-motion";

function parseBirthday(birthday: string): { day: number; month: number } | null {
  const clean = birthday.trim().toLowerCase();
  const monthMap: Record<string, number> = {
    "janvier": 1, "février": 2, "fevrier": 2, "mars": 3, "avril": 4,
    "mai": 5, "juin": 6, "juillet": 7, "août": 8, "aout": 8,
    "septembre": 9, "octobre": 10, "novembre": 11, "décembre": 12, "decembre": 12,
  };
  const parts = clean.split(" ");
  if (parts.length < 2) return null;
  const day = parseInt(parts[0]);
  const month = monthMap[parts[1]];
  if (!day || !month) return null;
  return { day, month };
}

export default function BirthdayBanner() {
  const [birthdayBoys, setBirthdayBoys] = useState<typeof members>([]);
  const [isVisible, setIsVisible] = useState(true); // Nouvel état pour gérer la visibilité

  useEffect(() => {
    const now = new Date();
    const todayDay = now.getDate();
    const todayMonth = now.getMonth() + 1;

    const celebratingToday = members.filter(m => {
      const parsed = parseBirthday(m.birthday);
      return parsed && parsed.day === todayDay && parsed.month === todayMonth;
    });

    setBirthdayBoys(celebratingToday);
  }, []);

  // Si on a fermé la bannière ou qu'il n'y a pas d'anniversaire, on n'affiche rien
  if (!isVisible || birthdayBoys.length === 0) return null;

  const names = birthdayBoys.map(m => m.name.split(" ")[0]).join(" & ");

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }} // Animation de sortie quand on ferme
        style={{
          background: "linear-gradient(90deg, #f03e3e, #ec4899, #f03e3e)",
          backgroundSize: "200% auto",
          animation: "gradientMove 3s ease infinite",
          color: "#fff",
          padding: "10px 40px 10px 20px", // J'ai ajouté du padding à droite pour faire de la place à la croix
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: "'Barlow Condensed', sans-serif",
          boxShadow: "0 4px 15px rgba(240,62,62,0.4)",
          position: "relative",
          zIndex: 9999
        }}
      >
        <style>{`
          @keyframes gradientMove {
            0% { background-position: 0% center; }
            50% { background-position: 100% center; }
            100% { background-position: 0% center; }
          }
        `}</style>
        
        <Link href="/birthdays" style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
          <Gift size={18} />
          <span style={{ fontSize: "14px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>
             C'est l'anniversaire de {names} aujourd'hui !
          </span>
          <span style={{ background: "rgba(0,0,0,0.2)", padding: "2px 8px", borderRadius: "100px", fontSize: "11px", fontWeight: 900, display: "flex", alignItems: "center", gap: "4px" }}>
            FÊTER ÇA <ChevronRight size={12} />
          </span>
        </Link>

        {/* LE BOUTON FERMER */}
        <button 
          onClick={() => setIsVisible(false)}
          style={{
            position: "absolute",
            right: "15px",
            background: "rgba(0,0,0,0.15)",
            border: "none",
            borderRadius: "50%",
            width: "26px",
            height: "26px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            cursor: "pointer",
            transition: "background 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.3)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.15)"}
          title="Fermer"
        >
          <X size={16} />
        </button>

      </motion.div>
    </AnimatePresence>
  );
}