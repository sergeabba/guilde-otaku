"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Tv, BookOpen, Globe, ExternalLink, Search, Film } from "lucide-react";

// --- LES CATÉGORIES ---
const categories = ["Tout", "Animes", "Scans", "Films/Séries", "Utiles"];

// --- LA BASE DE DONNÉES DES BONS PLANS ---
const links = [
  // --- LES LIENS DU DON ---
  { 
    id: 101, title: "Anime-Sama", desc: "La référence actuelle. Excellente plateforme de streaming anime communautaire.", 
    url: "https://anime-sama.to/", category: "Animes", 
    logo: "https://www.google.com/s2/favicons?domain=anime-sama.to&sz=128", fallbackIcon: Tv, color: "#8b5cf6" 
  },
  { 
    id: 102, title: "SushiScan", desc: "La meilleure base pour lire vos scans mangas en VF rapidement.", 
    url: "https://sushiscan.net/", category: "Scans", 
    logo: "https://www.google.com/s2/favicons?domain=sushiscan.net&sz=128", fallbackIcon: BookOpen, color: "#f43f5e" 
  },
  { 
    id: 103, title: "FRAnime", desc: "Site de stream anime très fluide, très complet et sans prise de tête.", 
    url: "https://franime.fr/", category: "Animes", 
    logo: "https://www.google.com/s2/favicons?domain=franime.fr&sz=128", fallbackIcon: Tv, color: "#f97316" 
  },
  { 
    id: 104, title: "VoirAnime", desc: "L'un des plus connus. Streaming d'animes très souvent mis à jour.", 
    url: "https://voiranime.tv/", category: "Animes", 
    logo: "https://www.google.com/s2/favicons?domain=voiranime.com&sz=128", fallbackIcon: Tv, color: "#3b82f6" 
  },
  { 
    id: 105, title: "AnimeOVF", desc: "Un excellent plan pour vos streams d'anime VF et VOSTFR.", 
    url: "https://animeovf.fr/", category: "Animes", 
    logo: "https://www.google.com/s2/favicons?domain=animeovf.fr&sz=128", fallbackIcon: Tv, color: "#10b981" 
  },
  { 
    id: 106, title: "Movix", desc: "Le bon plan du Don pour le streaming de vos Séries et Films classiques.", 
    url: "https://movix.rodeo/", category: "Films/Séries", 
    logo: "https://www.google.com/s2/favicons?domain=movix.rodeo&sz=128", fallbackIcon: Film, color: "#eab308" 
  },
  { 
    id: 107, title: "SadisFlix", desc: "Un autre site très solide pour le streaming de films récents.", 
    url: "https://sadisflix-officiel.icu/", category: "Films/Séries", 
    logo: "https://www.google.com/s2/favicons?domain=sadisflix-officiel.icu&sz=128", fallbackIcon: Film, color: "#ec4899" 
  },
  { 
    id: 108, title: "FS7", desc: "Très bonne alternative de streaming pour les films de tout genre.", 
    url: "https://fs7.lol/", category: "Films/Séries", 
    logo: "https://www.google.com/s2/favicons?domain=fs7.lol&sz=128", fallbackIcon: Film, color: "#6366f1" 
  },

  // --- LES NOUVEAUX LIENS DU DON ---
  { 
    id: 109, title: "MovieBox", desc: "Excellente alternative de site de stream film pour vos soirées cinéma.", 
    url: "https://moviebox.ph/", category: "Films/Séries", 
    logo: "https://www.google.com/s2/favicons?domain=moviebox.ph&sz=128", fallbackIcon: Film, color: "#14b8a6" 
  },
  { 
    id: 110, title: "DessinAnime", desc: "La plateforme idéale pour retrouver chaque dessin animé et anime.", 
    url: "https://dessinanime.cc/", category: "Animes", 
    logo: "https://www.google.com/s2/favicons?domain=dessinanime.cc&sz=128", fallbackIcon: Tv, color: "#a855f7" 
  },
  { 
    id: 111, title: "WiTV", desc: "La solution parfaite pour regarder la telé en Stream et tout le reste.", 
    url: "https://witv.team/", category: "Utiles", 
    logo: "https://www.google.com/s2/favicons?domain=witv.team&sz=128", fallbackIcon: Tv, color: "#f43f5e" 
  },
  { 
    id: 112, title: "Ygg", desc: "Le tracker de référence pour retrouver tous les torrents fr.", 
    url: "https://ygg.gratis/", category: "Utiles", 
    logo: "https://www.google.com/s2/favicons?domain=ygg.gratis&sz=128", fallbackIcon: Globe, color: "#0ea5e9" 
  },

  // --- QUELQUES LIENS OFFICIELS / UTILES POUR COMPLÉTER ---
  { 
    id: 1, title: "Crunchyroll", desc: "Le géant du streaming. Indispensable pour les simulcasts officiels.", 
    url: "https://www.crunchyroll.com", category: "Animes", 
    logo: "https://cdn.simpleicons.org/crunchyroll/f97316",
    fallbackIcon: Tv, color: "#f97316" 
  },
  { 
    id: 2, title: "Manga Plus", desc: "Les chapitres Shueisha en direct du Japon, 100% légal et gratuit.", 
    url: "https://mangaplus.shueisha.co.jp", category: "Scans", 
    logo: "/logos/mangaplus.png",
    fallbackIcon: BookOpen, color: "#ef4444" 
  },
  { 
    id: 6, title: "MyAnimeList", desc: "La bible. Pour traquer tout ce que vous avez regardé ou lu.", 
    url: "https://myanimelist.net", category: "Utiles", 
    logo: "https://cdn.simpleicons.org/myanimelist/3b82f6",
    fallbackIcon: Globe, color: "#3b82f6" 
  },
];
// Composant intelligent pour afficher le logo s'il y en a un, ou l'icône sinon
const CardLogo = ({ logoUrl, FallbackIcon, color }: { logoUrl: string, FallbackIcon: any, color: string }) => {
  const [hasError, setHasError] = useState(false);

  return (
    <div style={{ 
      background: `${color}15`, 
      width: "48px", height: "48px", borderRadius: "12px", 
      display: "flex", alignItems: "center", justifyContent: "center",
      color: color, padding: "8px"
    }}>
      {logoUrl && !hasError ? (
        <img 
          src={logoUrl} 
          alt="logo" 
          onError={() => setHasError(true)} 
          style={{ width: "100%", height: "100%", objectFit: "contain" }} 
        />
      ) : (
        <FallbackIcon size={24} />
      )}
    </div>
  );
};

export default function BonsPlansPage() {
  const [activeCategory, setActiveCategory] = useState("Tout");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLinks = links.filter((link) => {
    const matchesCategory = activeCategory === "Tout" || link.category === activeCategory;
    const matchesSearch = link.title.toLowerCase().includes(searchTerm.toLowerCase()) || link.desc.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{
      minHeight: "100vh", background: "#050505", color: "#fff",
      fontFamily: "'Barlow Condensed', sans-serif",
      position: "relative", overflow: "hidden", display: "flex", flexDirection: "column",
    }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.1, backgroundImage: "radial-gradient(circle at 50% 0%, #c9a84c 0%, transparent 60%)", zIndex: 0, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, opacity: 0.05, backgroundImage: "repeating-linear-gradient(0deg, #1a1a1a 0, #1a1a1a 1px, transparent 1px, transparent 20px)", zIndex: 0, pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 32px", background: "linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)" }}>
        <Link href="/" style={{ color: "#fff", textDecoration: "none", fontSize: "15px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em" }}>← Retour Guilde</Link>
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center" }}>
          <span style={{ fontSize: "13px", fontWeight: 800, color: "#c9a84c", letterSpacing: "0.3em", textTransform: "uppercase", display: "none" }} className="md:block">
            LE COFFRE DU DON
          </span>
        </div>
      </div>

      <main style={{ flex: 1, padding: "40px 5%", position: "relative", zIndex: 10, maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
        
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{ fontSize: "clamp(36px, 6vw, 60px)", fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: "0.02em", lineHeight: 1 }}>
            LES BONS PLANS <span style={{ color: "#c9a84c", fontStyle: "italic" }}>OTAKU</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "16px", letterSpacing: "0.1em", marginTop: "10px", marginBottom: "30px" }}>
            LES ARCHIVES SECRÈTES DE LA GUILDE : STREAMS, SCANS ET ASTUCES.
          </p>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "100px", padding: "10px 20px", width: "min(400px, 100%)", transition: "all 0.3s" }}>
              <Search size={18} color="rgba(255,255,255,0.4)" style={{ marginRight: "12px" }} />
              <input 
                type="text" placeholder="Rechercher un site..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                style={{ background: "transparent", border: "none", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px", outline: "none", width: "100%", letterSpacing: "0.05em" }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px", marginBottom: "40px" }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                background: activeCategory === cat ? "#c9a84c" : "rgba(255,255,255,0.05)",
                color: activeCategory === cat ? "#000" : "rgba(255,255,255,0.6)",
                border: "1px solid",
                borderColor: activeCategory === cat ? "#c9a84c" : "rgba(255,255,255,0.1)",
                padding: "8px 20px", borderRadius: "100px", cursor: "pointer",
                fontFamily: "'Barlow Condensed', sans-serif", fontSize: "14px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em",
                transition: "all 0.2s"
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <motion.div layout style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
          <AnimatePresence>
            {filteredLinks.map((link) => (
              <motion.a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                layout
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }}
                style={{
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px",
                  padding: "24px", textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column",
                  position: "relative", overflow: "hidden", cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.borderColor = link.color;
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: link.color, opacity: 0.8 }} />
                
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                  <CardLogo logoUrl={link.logo} FallbackIcon={link.fallbackIcon} color={link.color} />
                  <ExternalLink size={18} color="rgba(255,255,255,0.3)" />
                </div>
                
                <h3 style={{ fontSize: "24px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                  {link.title}
                </h3>
                
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "15px", lineHeight: 1.4, flex: 1, marginBottom: "20px" }}>
                  {link.desc}
                </p>

                <div style={{ display: "inline-block", background: "rgba(255,255,255,0.05)", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", alignSelf: "flex-start" }}>
                  {link.category}
                </div>
              </motion.a>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredLinks.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.4)", fontSize: "18px", fontStyle: "italic" }}>
            Aucun trésor trouvé pour cette recherche...
          </div>
        )}

      </main>
    </div>
  );
}