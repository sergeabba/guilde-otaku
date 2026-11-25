# Guilde Otaku · DESIGN.md v2

Charte de direction artistique. Elle s'appuie sur `guilde-design` (tokens, composants),
`guilde-studio` (routeur des skills) et les règles de `CLAUDE.md`.
Statut : **proposition Phase 1**, à valider (direction typographique en attente de choix).

## 1. L'idée

La Guilde Otaku n'est pas un site sur les mangas : c'est **le lieu d'une bande d'amis
devenue une guilde**, avec ses grades, ses légendes, ses rituels et ses jeux. Chaque
visite doit donner le sentiment d'entrer dans un quartier général vivant, où l'on se
reconnaît, où l'on progresse et où l'on joue.

Trois phrases pour trancher un choix de design :
1. **On appartient** (Fairy Tail) : les membres passent avant tout ; leurs visages, leurs
   noms et leurs rangs sont les héros de chaque page.
2. **On raconte** (Shonen Jump) : la mise en page est éditoriale, par chapitres, avec des
   cases, des titres qui claquent et des silences.
3. **On joue** (Smash, Street Fighter, Persona) : chaque interaction répond, se
   collectionne et se partage.

L'identité de la Guilde reste plus forte que ses références : encre noire et papier,
couleur par rang, trames et traits de vitesse, emblème, rōmaji, humour des bios.

## 2. Ce qui ne change pas

- Données, profils, illustrations, bios, rangs, moteur de Fighters : préservés.
- Rōmaji uniquement, jamais d'écriture japonaise affichée. Aucune donnée inventée.
- Couleurs de rang (`rankAccents`), thème sombre et thème papier, emblème, Dela Gothic One
  comme voix de l'identité (logo, numéros, gros titres selon la direction retenue).
- Accessibilité : contraste, focus visible, cibles de 44 px, mouvement réduit.

## 3. Un univers, plusieurs registres

Les rubriques ne deviennent pas toutes des jeux vidéo. Chacune a un **registre** et une
**signature** (un élément qu'on ne retrouve que chez elle), sur le même socle (encre,
papier, couleur de rang, typographie de la Guilde).

| Rubrique | Registre | Signature proposée | Transition d'entrée |
|---|---|---|---|
| Accueil | Couverture de magazine hebdo | Une « une » qui change chaque semaine (membre à l'honneur, chiffre, citation), sommaire numéroté | Ouverture de couverture |
| Annuaire (Membres) | Collection de personnages (Smash) | Grille de portraits qui se retournent anime / réel, filtres par rang comme des onglets de classeur | Les cartes se distribuent |
| Fiche membre | Dossier + planche manga | Bascule fiche / planche, carte téléchargeable | Le portrait de l'annuaire devient celui de la fiche (déjà en place) |
| Rangs et promotions | Cérémonie RPG (Final Fantasy, Metaphor) | Emblème de rang qui se forge, parchemin de promotion partageable | Fondu au noir, lumière |
| Teams | Jour de match (presse sportive) | Composition annoncée poste par poste | Panneau de score qui bascule |
| Fighters | Salle d'arcade (SF6, KOF, DBFZ) | Écran titre, sélection, versus | Rideau d'arcade, « Here comes » |
| Jeux | Quiz-show télévisé | Plateau, buzzer, tableau des scores | Jingle visuel |
| Cinéma | Salle obscure | Rideau, lumière qui baisse, bande-annonce | Fondu au noir |
| Bibliothèque | Étagère de tomes reliés | Dos de volumes, fiche en page de garde | Le tome sort de l'étagère |
| Calendrier | Grille de diffusion télé | Programme du jour, chaîne en direct | Changement de chaîne |
| Anniversaires | Fête de quartier | Banderoles, confettis mesurés | Lancer de confettis (une fois) |
| Wanted | Avis de recherche (déjà fort) | Affiches et primes | Affiche clouée |
| Futilités | Atelier d'artiste | Mur d'épingles, cadres | Rideau d'atelier |
| Journal (nouveau) | Quotidien de la Guilde | Une, colonnes, brèves | Pliage de journal |
| Musée (nouveau) | Musée et frise chronologique | Salles par époque, vitrines | Couloir qui avance |
| QG (nouveau) | Carte du quartier général | Lieux à visiter, progression | Zoom sur la carte |

Les signatures se construisent progressivement (Phases 2 et 3). Une rubrique n'en a
qu'une ; le reste de la page reste calme et lisible.

## 4. Typographie

Rôles communs à toutes les directions :
- **affiche** : titres de page et grands moments ;
- **accroche** : chapô, citations, numéros de chapitre (voix éditoriale) ;
- **interface** : boutons, onglets, étiquettes ;
- **chiffres** : stats, primes, puissance, scores (chiffres tabulaires) ;
- **texte courant** : Barlow, dans toutes les directions (lecture, 45 à 75 signes).

Trois directions en aperçu (`?typo=hebdo`, `?typo=kirikomi`, `?typo=densetsu` sur
n'importe quelle page) :

| | A · Hebdo | B · Kirikomi | C · Densetsu |
|---|---|---|---|
| Esprit | Magazine manga premium | Affiche de combat | Légende de la guilde |
| Affiche | Dela Gothic One, serrée | Anton, capitales inclinées | Cinzel 900, capitales gravées |
| Accroche | Fraunces italique | Barlow (pas de voix éditoriale) | Cormorant Garamond italique |
| Interface | Barlow Condensed | Archivo très large | Barlow Condensed |
| Chiffres | Barlow Condensed | Chakra Petch | Dela Gothic One |
| Force | Le plus proche de l'identité actuelle, gagne en élégance | Le plus percutant, idéal Fighters et Teams | Le plus solennel, idéal rangs et musée |
| Risque | Moins de rupture visible | Peut fatiguer sur les pages de lecture | Peut sortir de l'univers manga |

Toutes les polices : SIL Open Font License 1.1 (usage web et commercial autorisé,
auto-hébergées dans `public/fonts`, licence dans chaque dossier).
**Recommandation** : A comme système principal, avec B réservé aux rubriques de jeu
(Fighters, Teams, Jeux) et C aux cérémonies (rangs, promotions, musée). Une direction
dominante, deux voix d'appoint, chacune avec un rôle qu'elle seule tient.

## 5. Couleur, matière, image

- Fond d'encre (`--gk-ink`) ou papier (`--gk-paper`) ; un seul accent par écran, la
  couleur du rang ou de la rubrique.
- Matières : trame d'impression, traits de vitesse, encre, papier. Pas de halos flous,
  pas de dégradés décoratifs, pas de verre dépoli. Un dégradé n'existe que s'il imite une
  lumière réelle (projecteur, salle obscure).
- Les illustrations des membres et les jaquettes officielles sont les images principales ;
  jamais d'images de stock ni d'illustrations générées présentées comme des membres.

## 6. Mouvement

Principes (skills `animate`, `choreograph`, `apple-design`) :
- **Le mouvement a un rôle** : orienter, confirmer, relier deux états, récompenser. Sinon,
  pas de mouvement.
- **Ressorts** pour ce qui suit un geste ou change d'état ; courbes de sortie rapides
  (`ease-in`) seulement pour ce qui disparaît.
- **Une chorégraphie par écran** : ce qui bouge, dans quel ordre, et ce qui reste
  immobile.
- Durées : 150 à 250 ms pour l'interface, 400 à 700 ms pour une entrée de page, plus long
  uniquement pour une cérémonie ou une cinématique, toujours interruptible.
- Boucles décoratives : rares, en pause hors écran (déjà en place).

## 7. Performance et confort

- Trois niveaux : **complet** (appareils récents), **allégé** (appareil lent, économie
  d'énergie : moins de particules, pas de WebGL), **réduit** (mouvement réduit demandé :
  états finaux visibles, fondus courts).
- Images : versions WebP pré-calculées (`scripts/optimize-images.mjs`), jamais l'original
  lourd à un téléphone. Fonds flous : miniature agrandie, pas de filtre.
- Budget indicatif par page sur téléphone : moins de 1,5 Mo au premier affichage.

## 8. À éviter (anti-modèles)

En-têtes identiques d'une rubrique à l'autre ; halos et ombres colorées floues ;
dégradés gratuits ; animations au défilement sur chaque bloc ; textes centrés partout ;
icônes décoratives sans rôle ; mises en page de modèle générique ; copier une interface
de jeu reconnaissable.
