"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase"; // ⚠️ Vérifie que le chemin pointe bien vers ton fichier supabase.ts

export default function AdminBiblio() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Chercher l'anime via l'API publique (Jikan)
  const searchAnime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    
    try {
      const res = await fetch(`https://api.jikan.moe/v4/anime?q=${query}&limit=4`);
      const data = await res.json();
      setResults(data.data || []);
    } catch (error) {
      console.error("Erreur de recherche:", error);
    }
    setLoading(false);
  };

  // 2. Sauvegarder dans TA base de données Supabase
  const addToDatabase = async (anime: any) => {
    const { error } = await supabase.from('bibliotheque').insert({
      title: anime.title,
      type: "Anime",
      cover_image: anime.images.jpg.large_image_url,
      score: anime.score,
      tier: "A définir", // Tu pourras le modifier plus tard
      synopsis: anime.synopsis
    });

    if (error) {
      alert("❌ Erreur lors de l'ajout : " + error.message);
    } else {
      alert(`✅ ${anime.title} a été ajouté à la Bibliothèque de la Guilde !`);
    }
  };

  return (
    <div style={{ padding: "50px", maxWidth: "800px", margin: "0 auto", color: "white", fontFamily: "sans-serif" }}>
      <h1 style={{ color: "#c9a84c", marginBottom: "20px" }}>⚙️ Espace Admin - Bibliothèque</h1>
      
      <form onSubmit={searchAnime} style={{ display: "flex", gap: "10px", marginBottom: "40px" }}>
        <input 
          type="text" 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          placeholder="Chercher un anime (ex: Frieren)..."
          style={{ padding: "10px", flex: 1, borderRadius: "5px", border: "none", color: "black" }}
        />
        <button type="submit" style={{ padding: "10px 20px", background: "#c9a84c", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>
          {loading ? "Recherche..." : "Chercher"}
        </button>
      </form>

      <div style={{ display: "grid", gap: "20px" }}>
        {results.map((anime) => (
          <div key={anime.mal_id} style={{ display: "flex", gap: "20px", background: "rgba(255,255,255,0.1)", padding: "15px", borderRadius: "10px" }}>
            <img src={anime.images.jpg.image_url} alt={anime.title} style={{ width: "100px", borderRadius: "5px" }} />
            <div>
              <h3>{anime.title}</h3>
              <p style={{ fontSize: "12px", opacity: 0.7, marginBottom: "10px" }}>Score MAL: {anime.score} ⭐</p>
              <button 
                onClick={() => addToDatabase(anime)}
                style={{ padding: "8px 15px", background: "#4ade80", color: "black", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
              >
                + Ajouter à la base de données
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}