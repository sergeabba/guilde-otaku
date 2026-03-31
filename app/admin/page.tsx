"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, BookOpen, User, Flame, ArrowRight, ShieldAlert } from "lucide-react";
import { colors, typography, font } from "../../outputs/styles/tokens";
import GuildeHeader from "../components/GuildeHeader";

export default function AdminHubPage() {
  const [password, setPassword] = useState("");
  const [auth, setAuth] = useState(false);
  const [errorLine, setErrorLine] = useState(false);

  const checkAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "1111") {
      setAuth(true);
    } else {
      setErrorLine(true);
      setTimeout(() => setErrorLine(false), 2000);
    }
  };

  if (!auth) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: colors.bg, color: colors.textPrimary, fontFamily: font, alignItems: "center", justifyContent: "center" }}>
        <GuildeHeader activePage="bibliotheque" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: colors.bgCard, padding: "40px", borderRadius: "24px", border: `1px solid ${errorLine ? colors.youtube : colors.border}`, maxWidth: "400px", width: "90%", textAlign: "center", boxShadow: errorLine ? `0 0 30px rgba(248,113,113,0.3)` : "none", transition: "all 0.3s" }}>
          
          <div style={{ background: "rgba(255,255,255,0.05)", width: "64px", height: "64px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <Lock size={28} color={errorLine ? colors.youtube : colors.gold} />
          </div>
          
          <h1 style={{ fontFamily: font, fontWeight: 900, textTransform: "uppercase", fontSize: "28px", marginBottom: "8px", fontStyle: "italic" }}>SÉCURITÉ GUILDE</h1>
          <p style={{ ...typography.body, color: colors.textSecondary, marginBottom: "32px" }}>
            Veuillez entrer le code confidentiel pour accéder à l'interface de commandement.
          </p>

          <form onSubmit={checkAuth} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Code d'accès"
              style={{ padding: "16px", background: "rgba(0,0,0,0.5)", border: `1px solid ${errorLine ? colors.youtube : colors.border}`, borderRadius: "12px", color: "#fff", fontFamily: font, fontSize: "16px", outline: "none", textAlign: "center", letterSpacing: "0.2em" }} autoFocus />
            <button type="submit"
              style={{ padding: "16px", background: colors.gold, border: "none", borderRadius: "12px", color: "#000", fontFamily: font, fontSize: "16px", fontWeight: 800, textTransform: "uppercase", cursor: "pointer", letterSpacing: "0.1em" }}>
              Déverrouiller
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, color: colors.textPrimary, fontFamily: font, paddingBottom: "80px" }}>
      <GuildeHeader activePage="bibliotheque" />
      
      <main style={{ maxWidth: "1000px", margin: "120px auto 0", padding: "0 24px" }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <ShieldAlert size={24} color={colors.gold} />
            <span style={{ fontFamily: font, fontSize: "14px", fontWeight: 800, color: colors.gold, letterSpacing: "0.2em", textTransform: "uppercase" }}>
              Réseau Sécurisé
            </span>
          </div>
          <h1 style={{ fontFamily: font, fontWeight: 900, textTransform: "uppercase", fontSize: "48px", marginBottom: "16px" }}>
            COMMANDEMENT OTAKU
          </h1>
          <p style={{ ...typography.body, color: colors.textSecondary, maxWidth: "600px", marginBottom: "60px" }}>
            Bienvenue dans le centre névralgique du site. Vous pouvez administrer l'intégralité des données en temps réel. N'oubliez pas que toute action ici modifie publiquement la plateforme.
          </p>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
          
          {/* Carte Bibliothèque */}
          <motion.div whileHover={{ scale: 1.02 }} style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "24px", padding: "32px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, right: 0, background: "rgba(167, 139, 250, 0.1)", width: "150px", height: "150px", filter: "blur(50px)", borderRadius: "50%" }} />
            <BookOpen size={32} color="#a78bfa" style={{ marginBottom: "20px" }} />
            <h2 style={{ fontFamily: font, fontSize: "28px", fontWeight: 900, marginBottom: "12px", textTransform: "uppercase" }}>Administration Bilio</h2>
            <p style={{ ...typography.body, color: colors.textSecondary, marginBottom: "32px" }}>
              Ajoutez des animes, jugez des mangas et choisissez qui figure dans la célèbre Chronique du Bash en page d'accueil.
            </p>
            <Link href="/admin-biblio" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.05)", border: `1px solid rgba(255,255,255,0.1)`, padding: "12px 24px", borderRadius: "100px", color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Gérer la Bibliothèque <ArrowRight size={16} />
            </Link>
          </motion.div>

          {/* Carte Fighters */}
          <motion.div whileHover={{ scale: 1.02 }} style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "24px", padding: "32px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, right: 0, background: "rgba(248, 113, 113, 0.1)", width: "150px", height: "150px", filter: "blur(50px)", borderRadius: "50%" }} />
            <Flame size={32} color="#f87171" style={{ marginBottom: "20px" }} />
            <h2 style={{ fontFamily: font, fontSize: "28px", fontWeight: 900, marginBottom: "12px", textTransform: "uppercase" }}>Roster Fighters</h2>
            <p style={{ ...typography.body, color: colors.textSecondary, marginBottom: "32px" }}>
              C'est ici qu'on recrute de nouveaux combattants, met à jour leurs compétences, et qu'on attribue les rangs légendaires de l'Arène.
            </p>
            <Link href="/admin-fighters" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.05)", border: `1px solid rgba(248,113,113,0.3)`, padding: "12px 24px", borderRadius: "100px", color: "#f87171", textDecoration: "none", fontWeight: 700, fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Entrer dans l'Arène <ArrowRight size={16} />
            </Link>
          </motion.div>

        </div>
      </main>
    </div>
  );
}
