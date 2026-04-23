"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tv, BookOpen, Globe, ExternalLink, Search, Film, Image as ImageIcon } from "lucide-react";
import GuildeHeader from "./GuildeHeader";
import type { SupabaseBonPlanRow } from "../types";

// --- LES CATÉGORIES ---
const categories = ["Tout", "Animes", "Scans", "Films/Séries", "Utiles"];

// ─── COMPOSANT DE CARTE DE BON PLAN ──────────────────────────────────────────
const LinkCard = ({ link }: { link: SupabaseBonPlanRow }) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);

  // Fallback map pour les icônes (si on le souhaite, sinon on utilise Globe partout)
  const getFallbackIcon = () => {
    switch(link.category) {
      case "Animes": return Tv;
      case "Films/Séries": return Film;
      case "Scans": return BookOpen;
      default: return Globe;
    }
  };
  const Icon = getFallbackIcon();

  // Déduire l'URL du logo Google S2
  let domain = "";
  try {
    domain = new URL(link.url).hostname;
  } catch (e) {
    domain = link.url; // fallback simple si 'url' n'est pas parsable en URL
  }
  const logoUrl = link.logo || `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

  useEffect(() => {
    // Fetcher l'open graph du site cible
    fetch(`/api/link-preview?url=${encodeURIComponent(link.url)}`)
      .then(res => res.json())
      .then(data => {
        if (data.image) {
          setPreviewImage(data.image);
        } else {
          // Fallback ultime : on prend un vrai screenshot de l'accueil du site via Thum.io
          setPreviewImage(`https://image.thum.io/get/width/1200/crop/630/noanimate/${link.url}`);
        }
        setLoadingPreview(false);
      })
      .catch(() => {
        // En cas d'erreur de notre API, on essaie quand même le screenshot
        setPreviewImage(`https://image.thum.io/get/width/1200/crop/630/noanimate/${link.url}`);
        setLoadingPreview(false);
      });
  }, [link.url]);

  return (
    <motion.a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      style={{
        background: "rgba(15, 15, 20, 0.4)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "20px",
        overflow: "hidden",
        textDecoration: "none",
        color: "inherit",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        cursor: "pointer",
        minHeight: "360px"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = link.color;
        e.currentTarget.style.transform = "translateY(-6px)";
        e.currentTarget.style.boxShadow = `0 20px 40px -10px ${link.color}40`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Ligne Accent en Haut */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: link.color, opacity: 0.8, zIndex: 10 }} />

      {/* Image de Couverture/Preview (OG:Image ou Screenshot) */}
      <div style={{ height: "180px", position: "relative", backgroundColor: "rgba(0,0,0,0.5)", overflow: "hidden" }}>
        <AnimatePresence mode="wait">
          {loadingPreview ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                <ImageIcon size={32} color="rgba(255,255,255,0.2)" />
              </motion.div>
            </motion.div>
          ) : previewImage ? (
            <motion.img 
              key="preview"
              src={previewImage} 
              alt="Website preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              onError={(e) => {
                // Si la capture d'écran échoue aussi, on efface l'image
                setPreviewImage(null);
              }}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", filter: "brightness(0.7) saturate(1.2)" }} 
            />
          ) : (
            <motion.div key="fallback" style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${link.color}20 0%, #000 100%)` }} />
          )}
        </AnimatePresence>

        {/* Logo overlayed sur la cover */}
        <div 
          style={{
            position: "absolute",
            bottom: "-20px",
            left: "20px",
            width: "56px",
            height: "56px",
            borderRadius: "14px",
            background: "#111",
            border: `2px solid ${link.color}`,
            boxShadow: `0 4px 12px ${link.color}40`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10
          }}
        >
           <img 
            src={logoUrl} 
            alt="logo"
            referrerPolicy="no-referrer"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
            style={{ width: "60%", height: "60%", objectFit: "contain" }} 
          />
        </div>
      </div>
      
      {/* Contenu */}
      <div style={{ padding: "30px 24px 24px", display: "flex", flexDirection: "column", flex: 1, zIndex: 10, background: "linear-gradient(to top, rgba(10,10,15,1) 0%, rgba(10,10,15,0.6) 100%)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
          <h3 style={{ fontSize: "24px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "#fff", margin: 0, lineHeight: 1.1 }}>
            {link.title}
          </h3>
          <ExternalLink size={18} color="rgba(255,255,255,0.3)" style={{ marginTop: "4px" }} />
        </div>
        
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", lineHeight: 1.5, flex: 1, margin: "8px 0 20px" }}>
          {link.desc}
        </p>

        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.05)", padding: "4px 12px", borderRadius: "100px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: link.color, textTransform: "uppercase", alignSelf: "flex-start", border: `1px solid ${link.color}30` }}>
          <Icon size={12} />
          {link.category}
        </div>
      </div>
    </motion.a>
  );
};

export default function BonsPlansClient({ initialLinks }: { initialLinks: SupabaseBonPlanRow[] }) {
  const [activeCategory, setActiveCategory] = useState("Tout");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLinks = initialLinks.filter((link) => {
    const matchesCategory = activeCategory === "Tout" || link.category === activeCategory;
    const titleMatch = (link.title || "").toLowerCase().includes(searchTerm.toLowerCase());
    const descMatch = (link.desc || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && (titleMatch || descMatch);
  });

  return (
    <div style={{
      minHeight: "100vh", background: "#050505", color: "#fff",
      fontFamily: "'Barlow Condensed', sans-serif",
      position: "relative", overflow: "hidden", display: "flex", flexDirection: "column",
    }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.1, backgroundImage: "radial-gradient(circle at 50% 0%, #c9a84c 0%, transparent 60%)", zIndex: 0, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, opacity: 0.05, backgroundImage: "repeating-linear-gradient(0deg, #1a1a1a 0, #1a1a1a 1px, transparent 1px, transparent 20px)", zIndex: 0, pointerEvents: "none" }} />

      <GuildeHeader activePage="bons-plans" />

      <main style={{ flex: 1, padding: "40px 5%", position: "relative", zIndex: 10, maxWidth: "1400px", margin: "0 auto", width: "100%" }}>
        
        <div style={{ textAlign: "center", marginBottom: "50px" }}>
          <h1 style={{ fontSize: "clamp(40px, 8vw, 80px)", fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: "0.02em", lineHeight: 1 }}>
            LES BONS PLANS <span style={{ color: "#c9a84c", fontStyle: "italic" }}>OTAKU</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "18px", letterSpacing: "0.1em", marginTop: "16px", marginBottom: "40px" }}>
            LES ARCHIVES SECRÈTES DE LA GUILDE : STREAMS, SCANS ET EXCLUSIVITÉS.
          </p>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "100px", padding: "12px 24px", width: "min(400px, 100%)", transition: "all 0.3s" }}>
              <Search size={20} color="rgba(255,255,255,0.4)" style={{ marginRight: "12px" }} />
              <input 
                type="text" placeholder="Rechercher un trésor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                style={{ background: "transparent", border: "none", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px", outline: "none", width: "100%", letterSpacing: "0.05em" }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px", marginBottom: "50px" }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                background: activeCategory === cat ? "#c9a84c" : "rgba(255,255,255,0.02)",
                color: activeCategory === cat ? "#000" : "rgba(255,255,255,0.6)",
                border: "1px solid",
                borderColor: activeCategory === cat ? "#c9a84c" : "rgba(255,255,255,0.1)",
                padding: "10px 24px", borderRadius: "100px", cursor: "pointer",
                fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                boxShadow: activeCategory === cat ? "0 4px 15px rgba(201, 168, 76, 0.3)" : "none",
                transform: activeCategory === cat ? "translateY(-2px)" : "none"
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <motion.div layout style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
          <AnimatePresence mode="popLayout">
            {filteredLinks.map((link) => (
              <LinkCard key={link.id} link={link} />
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredLinks.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "rgba(255,255,255,0.3)" }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
               <Globe size={48} opacity={0.5} style={{ marginBottom: "20px" }} />
               <p style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Aucun Trésor Trouvé</p>
               <p style={{ fontSize: "16px" }}>Essayez une autre recherche.</p>
            </motion.div>
          </div>
        )}

      </main>
    </div>
  );
}
