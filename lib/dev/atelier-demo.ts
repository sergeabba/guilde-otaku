// Galerie factice de développement : les images réellement présentes dans public/atelier,
// pour tester la mise en page des Futilités quand l'API (clé de service) n'est pas
// disponible. Seulement en dev avec /atelier?demo=galerie ; jamais en production.
// Titres tirés des noms de fichiers ; catégories, univers et prompts FICTIFS.
const FILES = ["bash-grazy.png", "don-bashjjk.png", "duel-food.png", "florianemha.png", "food.jpg", "godwin-divine.png", "godwin-nagi.png", "godwintraicy1.png", "godwintraicy2.png", "jise-ben.png", "teamotaku.png", "trix.png"];
const CATS = ["Création", "Portrait", "Scène", "VFX"];
const UNIVERSES = ["Jujutsu Kaisen", "Blue Lock", "Démonstration", "Fairy Tail"];
const ACCENTS = ["#dfb75b", "#e8412c", "#4aa3ff", "#b07cff"];

export const ATELIER_DEMO = FILES.map((f, i) => ({
  id: 8000 + i, filename: `demo/${f}`, url: `/atelier/${f}`,
  title: f.replace(/\.[a-z]+$/, "").replace(/[-_]+/g, " ").replace(/\d+$/, "").trim().replace(/^\w/, (c) => c.toUpperCase()),
  description: "Description de démonstration (donnée factice de développement).",
  prompt: i % 2 ? "Prompt de démonstration : illustration anime, lumière de fin de journée, encre et trame." : "",
  category: CATS[i % CATS.length], universe: UNIVERSES[i % UNIVERSES.length], accent: ACCENTS[i % ACCENTS.length], size: "",
}));
