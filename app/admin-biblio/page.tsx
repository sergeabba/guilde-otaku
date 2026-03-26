"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase"; // Ton chemin est le bon maintenant !

export default function AdminBiblio() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Nouveaux états pour le mode "Édition"
  const [selectedAnime, setSelectedAnime] = useState<any | null>(null);
  const [frenchSynopsis, setFrenchSynopsis] = useState("");
  const [tier, setTier] = useState("A définir");
  const [note, setNote] = useState(0);

  // 1. Chercher l'anime
  const searchAnime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    setSelectedAnime(null); // On ferme l'éditeur si on lance une nouvelle recherche
    
    try {
      const res = await fetch(`https://api.jikan.moe/v4/anime?q=${query}&limit=4`);
      const data = await res.json();
      setResults(data.data || []);
    } catch (error) {
      console.error("Erreur de recherche:", error);
    }
    setLoading(false);
  };

  // 2. Préparer l'anime pour le traduire/modifier
  const handleSelectForEdit = (anime: any) => {
    setSelectedAnime(anime);
    setFrenchSynopsis(anime.synopsis || ""); // On met l'anglais par défaut, tu pourras l'effacer
    setNote(anime.score || 0);
    setTier("A définir");
    // Fait défiler la page vers le bas pour voir le formulaire
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  // 3. Sauvegarder dans la base de données
  const saveToDatabase = async () => {
    if (!selectedAnime) return;

    const { error } = await supabase.from('bibliotheque').insert({
      title: selectedAnime.title,
      type: "Anime",
      cover_image: selectedAnime.images.jpg.large_image_url,
      score: note,
      tier: tier,
      status: "Terminé",
      synopsis: frenchSynopsis // 🇫🇷 On envoie TON texte en français !
    });

    if (error) {
      alert("❌ Erreur lors de l'ajout : " + error.message);
    } else {
      alert(`✅ L'anime a été ajouté à la Bibliothèque de la Guilde !`);
      setSelectedAnime(null); // On referme l'éditeur
    }
  };

  return (
    <div style={{ padding: "50px", maxWidth: "800px", margin: "0 auto", color: "white", fontFamily: "sans-serif" }}>
      <h1 style={{ color: "#c9a84c", marginBottom: "20px" }}>⚙️ Espace Admin - Bibliothèque</h1>
      
      {/* BARRE DE RECHERCHE */}
      <form onSubmit={searchAnime} style={{ display: "flex", gap: "10px", marginBottom: "40px" }}>
        <input 
          type="text" 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          placeholder="Chercher un anime (ex: Vinland Saga)..."
          style={{ padding: "10px", flex: 1, borderRadius: "5px", border: "none", color: "black", fontSize: "16px" }}
        />
        <button type="submit" style={{ padding: "10px 20px", background: "#c9a84c", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", fontSize: "16px" }}>
          {loading ? "Recherche..." : "Chercher"}
        </button>
      </form>

      {/* RÉSULTATS */}
      <div style={{ display: "grid", gap: "15px", marginBottom: "40px" }}>
        {results.map((anime) => (
          <div key={anime.mal_id} style={{ display: "flex", gap: "20px", background: "rgba(255,255,255,0.05)", padding: "15px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <img src={anime.images.jpg.image_url} alt={anime.title} style={{ width: "80px", borderRadius: "5px", objectFit: "cover" }} />
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: "0 0 5px 0" }}>{anime.title}</h3>
              <p style={{ fontSize: "12px", opacity: 0.5, margin: "0 0 15px 0" }}>Note MAL: {anime.score} / Année: {anime.year}</p>
              <button 
                onClick={() => handleSelectForEdit(anime)}
                style={{ padding: "8px 15px", background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid white", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
              >
                ✏️ Préparer pour l'ajout
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 🇫🇷 LE FORMULAIRE DE PERSONNALISATION 🇫🇷 */}
      {selectedAnime && (
        <div style={{ background: "rgba(201,168,76,0.1)", padding: "30px", borderRadius: "15px", border: "2px solid #c9a84c" }}>
          <h2 style={{ color: "#c9a84c", marginTop: 0 }}>Ajout de : {selectedAnime.title}</h2>
          
          <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
            {/* Choisir le Tier */}
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>Classement (Tier)</label>
              <select value={tier} onChange={(e) => setTier(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "none", color: "black" }}>
                <option value="A définir">En attente (A définir)</option>
                <option value="Chef-d'œuvre">Chef-d'œuvre</option>
                <option value="Pépite">Pépite</option>
                <option value="Bof">Bof</option>
                <option value="Surcoté">Surcoté</option>
              </select>
            </div>

            {/* Ajuster la note */}
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>Note de la Guilde (/10)</label>
              <input type="number" step="0.1" max="10" min="0" value={note} onChange={(e) => setNote(parseFloat(e.target.value))} style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "none", color: "black" }} />
            </div>
          </div>

          {/* Traduire le synopsis */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>Synopsis (Colle ton texte en Français ici)</label>
            <textarea 
              value={frenchSynopsis} 
              onChange={(e) => setFrenchSynopsis(e.target.value)} 
              rows={6}
              style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "none", color: "black", fontFamily: "sans-serif", resize: "vertical" }}
            />
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={saveToDatabase} style={{ flex: 1, padding: "15px", background: "#4ade80", color: "black", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "900", textTransform: "uppercase" }}>
              ✅ Confirmer et Sauvegarder
            </button>
            <button onClick={() => setSelectedAnime(null)} style={{ padding: "15px", background: "rgba(255,255,255,0.1)", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}