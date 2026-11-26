# Tranche jouable 1 : références à fournir pour les sprites

Les portraits anime des membres sont tous des bustes (tête et épaules). Un sprite de combat a
besoin du corps entier : jambes, mains, vêtements jusqu'aux pieds. D'après la méthode Codixel,
un corps inventé sans référence donne un mauvais résultat ; avec une référence en pied, la
conversion en pixel art, les os et l'animation donnent un résultat fidèle.

## Les quatre combattants (styles déduits de leurs statistiques réelles)

| Membre | Style | Pourquoi | Silhouette attendue |
|---|---|---|---|
| Roys (n°5) | Rushdown | force 92, vitesse 96 | manteau militaire bleu sombre, cheveux noirs, posture penchée en avant |
| Godwin / Balara (n°27) | Grappler | force 88, vitesse 70, 1 m 95 | très grand, cheveux blancs, tenue sombre, posture haute et lourde |
| Gleyn (n°21) | Speedster | vitesse 92 | silhouette fine, cheveux blonds en épis, veste jaune à motifs triangles |
| Mike (n°8) | Technique | technique 95 | cheveux mi-blancs mi-rouges, veste d'uniforme bleu, blanc et rouge |

## Ce qu'il me faut pour chacun

Une image par pose, **personnage entier, des cheveux aux pieds**, sur **fond uni** (blanc ou
vert), **vu de profil trois-quarts tourné vers la droite**, même échelle et même cadrage pour
toutes les poses d'un personnage. Format PNG ou JPG, au moins **1024 px de haut**, le
personnage occupant environ 85 % de la hauteur. Style : le même dessin anime que son portrait
actuel sur le site (mêmes couleurs de cheveux et de vêtements).

Poses, par ordre d'importance (les 6 premières suffisent pour commencer) :

1. **Garde** : en position de combat, poings levés, jambes fléchies (la pose de base).
2. **Marche** : un pas en avant, jambe avant tendue.
3. **Coup de poing** : bras avant tendu à l'horizontale, épaule en avant.
4. **Coup de pied** : jambe avant tendue à hauteur de taille.
5. **Touché** : tête rejetée en arrière, buste qui recule.
6. **Victoire** : pose propre au personnage (voir prompts).
7. Saut (genoux repliés), accroupi, garde basse, chute au sol, technique signature.

## Prompts (pour un générateur d'images ou un illustrateur)

Base commune, à placer au début :

> Full body anime character, standing in profile three-quarter view facing right, head to toe
> visible, plain white background, flat cel shading, clean lineart, fighting game character
> design reference sheet, consistent proportions, no text, no logo.

Puis, par personnage :

- **Roys** : « young man, black hair, dark navy military coat with silver trim and gloves,
  aggressive forward-leaning fighting stance, fast striker » + la pose.
- **Godwin** : « very tall lanky young man (1.95 m), messy white hair covering one eye, black
  high-collar jacket, calm half-asleep expression, heavy wrestler stance » + la pose.
- **Gleyn** : « slim young man, spiky blond hair, mustard-yellow haori with white triangle
  pattern over a dark uniform, low sprinter stance, lightning-fast » + la pose.
- **Mike** : « young man, hair split half white half red, navy and white school uniform jacket
  with red accents, composed technical fighting stance » + la pose.

Victoire : Roys claque des doigts, Godwin bâille les mains dans les poches, Gleyn se fige un
genou à terre, Mike remet son col en place.

## Ce que je fais à réception

1. Détourage et conversion en pixel art (hauteur 76 px, palette par personnage). Aperçu à valider.
2. Os et animation de chaque pose (anticipation, frame d'impact, retour). Aperçu GIF et planche numérotée.
3. Une fois validé : planches de sprites du jeu, coups calés sur les frames, tests de combat.

Dépose les fichiers dans `public/fighters/ref/<prenom>/` (par exemple `public/fighters/ref/roys/garde.png`)
ou envoie-les dans la conversation.
