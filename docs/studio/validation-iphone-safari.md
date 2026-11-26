# Validation sur iPhone (Safari)

WebKit n'est pas disponible dans l'environnement de développement (Playwright n'y a que
Chromium). Les comportements propres à Safari doivent donc être vérifiés sur un vrai iPhone.
Un point n'est considéré comme réglé qu'une fois coché ici sur l'appareil.

## Préparation
- Ouvrir l'aperçu (`apercu-guilde`) dans Safari, connecté à Vercel.
- Faire chaque test deux fois : barre d'adresse en bas (réglage par défaut) et en haut
  (Réglages → Apps → Safari → Onglets : « Un seul onglet »).
- Vider le cache une fois : Réglages → Apps → Safari → Effacer historique et données.
- Pour une capture longue : capture d'écran → onglet « Pleine page » (PDF).

## Liste à cocher

| # | Écran | Geste | Attendu |
|---|---|---|---|
| 1 | Accueil | Défiler du haut jusqu'au pied de page | Défilement natif, sans saut ; la barre de navigation basse ne recouvre aucun bouton |
| 2 | Accueil | Arriver en haut, faire rebondir | L'en-tête ne disparaît pas, rien ne se superpose |
| 3 | Toutes pages | Barre Safari qui se replie pendant le défilement | Aucun élément fixe ne saute ; aucune bande vide en bas |
| 4 | Toutes pages | iPhone avec encoche ou Dynamic Island, en paysage | Le contenu reste dans les zones de sécurité ; boutons à au moins 44 px |
| 5 | Fiche membre (ex. /membres/27) | Défiler lentement depuis le haut | Le numéro et le nom ne passent jamais sous l'en-tête |
| 6 | Fiche membre | Basculer Anime / Réel | Le portrait change sans recadrage cassé ; préférence gardée en revenant |
| 7 | Fiche membre | Scènes de pouvoir | Particules fluides ; texte lisible ; aucune scène ne bloque le défilement |
| 8 | Teams | Ouvrir une équipe publiée | Aucun « ? » bleu sur les portraits ; écusson et capitaine visibles |
| 9 | Menu « Sommaire » | Ouvrir, défiler, fermer | Le fond ne défile pas derrière ; fermeture par le bouton et par retour |
| 10 | Boutons flottants (bascule, musique) | Repérer leur position | Entièrement visibles, jamais coupés à droite |
| 11 | Fighters | Paysage, combat tactile | Commandes au pouce, pas de zoom au double appui, pas de sélection de texte |
| 12 | Retour arrière | Ouvrir une fiche depuis l'annuaire puis revenir | Retour à la même position de lecture |

## Rapporter un problème
Pour chaque ligne en échec : capture, modèle d'iPhone, version d'iOS, position de la barre
d'adresse. Une capture suffit pour que la correction puisse être faite et revérifiée ici.
