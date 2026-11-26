# DESIGN.md · Guilde Otaku · DA v3 « Le Sceau et la Lame »

Moodboard et critique : `docs/studio/da-v3-moodboard.md`. Prototypes comparés : `/explo/v3/menu`
(H1, retenu pour l'accueil), `/explo/v3/grimoire` (H2, retenu pour le registre « prestige »),
`/explo/v3/membre/[id]` (fiche de personnage), `/explo/v3/systeme` (bibliothèque).

## 1. Idée

Deux registres qui se répondent, sur une base manga :
- **La lame** (énergie, d'après les principes de Persona 5 Royal) : dalles découpées, angles,
  rouge-noir-papier, personnage qui traverse les plans et réagit à la navigation.
- **Le sceau** (prestige, d'après les principes de Metaphor: ReFantazio) : emblèmes gravés,
  phylactères, ornements, papier grainé, capitales à empattements, portraits fondus au pinceau.
- **Le manga** : scènes coupées en biais, trames, encre, bulles, lettrines.
- **Apple** : défilement natif, actions au pouce, animations interruptibles, finition.

Test de réussite : **une capture fixe doit suffire** à reconnaître la Guilde. Si l'on retire
les animations et qu'il reste un site classique, la composition est à reprendre.

## 2. Formes de la Guilde

| Forme | Composant | Règle |
| --- | --- | --- |
| Lame | `components/guilde/Lame.tsx` | Quadrilatère irrégulier déterministe (jamais deux angles égaux), dalle d'ombre décalée. Titres, entrées, boutons. |
| Sceau | `components/guilde/Sceau.tsx` | Deux anneaux, texte gravé (rōmaji), quatre clous, glyphe central. Un par grade (9) et par rubrique (13), glyphes originaux dans `glyphs.tsx`. |
| Phylactère | `components/guilde/Phylactere.tsx` | Ruban à queues repliées : noms, titres, distinctions. |
| Cadre | `components/guilde/Ornement.tsx` | Quatre coins ornementaux : transforme une surface en page d'ouvrage. |
| Scène | `.gu-scene` | Remplace la section rectangulaire : bord coupé en biais, chevauchement avec la scène précédente. |
| Masque au pinceau | `textures.ts › brushMask()` | Fond un portrait dans la page au lieu de l'encadrer. |
| Arcane | `components/home/Arcane.tsx` | Carte d'un membre : numéro romain, champ étoilé au grade, personnage qui déborde. |

**Interdit** : section rectangulaire pleine largeur sans coupe, carte à coins arrondis, bouton
rectangle générique, portrait posé dans un cadre neutre, dégradé décoratif, halo.

## 3. Typographie

| Rôle | Police | Usage |
| --- | --- | --- |
| Action, titres | Barlow Condensed 900 italique, capitales | `.gk-display`, lames, menus |
| Impact | Anton | chiffres géants, numéros, date |
| Prestige | Cinzel | noms de personnage, phylactères, table des arcanes |
| Récit | Fraunces (italique) | bios, citations, effets de pouvoir (avec lettrine) |
| Lecture | Barlow | textes courants, formulaires |
| Collage | `Ransom` | titre d'accueil, nom de bankai, entrée choisie : moments seulement |

## 4. Couleur et matière

Trois tons de base : **nuit** `#0b0a12`, **papier** `#f2eadb`, **rouge** `#c8102e`, plus l'**or**
`#e9c46a` pour le prestige. La couleur du grade est l'unique accent variable (dalle, écho de
silhouette, ombre de lame). Matières : grain de papier (SVG), pois, étoiles à quatre branches.
Trois atmosphères de scène : nuit, papier, rouge.

## 5. Composition

- Asymétrie et diagonale : chaque écran a une diagonale qui porte la lecture.
- Superposition, de l'arrière vers l'avant : matière → bande ou dalle → sceau → écho de
  silhouette → personnage → texte. Le personnage **chevauche** au moins un autre plan.
- Le personnage réagit à la navigation (hôte par entrée, choisi d'après les fiches).
- Chaque rubrique place son emblème autrement (`.rm-big.rm-<rubrique>`).

## 6. Mouvement

Une transition est une forme : coupe diagonale (entrée d'un personnage), tache d'encre (Anime /
Réel), tampon (distinctions), éclair et arrêt sur image (VS). Toujours interruptible, jamais
bloquant ; `prefers-reduced-motion` : états finaux, aucun mouvement décoratif.

## 7. Téléphone

Même identité, autre composition : pile verticale, défilement natif, entrées pleine largeur
≥ 48 px, aucun défilement horizontal imposé, aucun contenu au seul survol.

## 8. Rubriques

| Rubrique | Registre | Emblème |
| --- | --- | --- |
| Accueil | Lame (menu de pause) + Sceau (table des arcanes) | flamme |
| Membres | Arcanes, sélection | trois têtes |
| Fiche | Personnage (lame) + profil (parchemin) + scènes bankai et territoire | sceau du grade |
| Fighters | Jeu d'arcade (écran titre, sélection, VS) | éclair |
| Wanted | Affiche | viseur |
| Anniversaires | Fête | bougie |
| Bibliothèque | Magazine | livre ouvert |
| Calendrier | Grille de diffusion | phases de lune |
| Jeux | Salle d'arcade | dé |
| Futilités | Atelier | pinceau |
| Bons plans | Petites annonces | clé |
| Teams | Jour de match | écu |
| Cinéma | Salle obscure | bobine |

Administration : sobre et fonctionnelle (typographie commune seulement).

## 9. Contenu

Rōmaji seulement, aucune écriture japonaise affichée ; aucune donnée inventée (les hôtes et les
raisons affichées viennent des fiches) ; aucune image ni interface reprise d'un jeu existant.
