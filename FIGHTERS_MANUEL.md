# Guilde Fighters : mise à jour manuelle

Cette livraison est construite uniquement à partir de `guilde-otaku-actuel.zip` fourni le 13 novembre 2026. Elle ne modifie ni Supabase, ni les variables d'environnement, ni les autres rubriques.

## Modifications

- Ouverture directe sur la sélection des combattants ; bouton « Modes de jeu » pour les réglages.
- Présentation arcade : grands portraits, cadre métallique, camps rouge/bleu, roster hexagonal contrasté et recherche disponible sur téléphone en portrait.
- Aperçu animé du véritable sprite du combattant sélectionné. Portraits conservés dans leur orientation d'origine, sans miroir qui inverserait les textes dans une photo.
- 53 nouvelles interprétations en pixel art des photos locales, en plus de Craig et Melrick : 55 membres disposent d'une planche dédiée. Cheveux, vêtements et accessoires sont déclarés individuellement, pas tirés au hasard de l'identifiant.
- Les animations utilisent un squelette commun : les interprétations graphiques restent à valider avec les membres. Il ne s'agit pas de 55 animations entièrement dessinées à la main ni d'une reproduction du niveau artistique de SNK.
- Annaëlle (54) reste provisoire : sa photo est absente de cette archive. Les nouveaux membres inconnus gardent aussi le repli provisoire.
- Correction de la casse du chemin local de la photo de Junior : `junior.jpg`.
- Deux techniques communes : uppercut et pied de rupture. Les pouvoirs personnels déjà décrits, dont le quiz de Craig et la régénération de Melrick, sont conservés.

## Commandes supplémentaires

| Coup | Commande (par rapport à l'adversaire) | Raccourci J1 |
| --- | --- | --- |
| Uppercut | avant, bas, bas-avant + poing | bas + O |
| Pied de rupture | bas, bas-arrière, arrière + pied | arrière + O |
| Spéciale du membre | bas, bas-avant, avant + poing | O sans direction |

Les mêmes directions peuvent être utilisées avec le bouton Spé sur téléphone. Les commandes sont aussi expliquées dans le menu de pause.

## Installation

1. Conserver une sauvegarde du dossier actuel ou un commit Git local.
2. Fermer le serveur `npm run dev` avant la copie.
3. Décompresser ce ZIP dans le dossier du projet, en remplaçant les fichiers concernés. Garder les dossiers `app/`, `lib/`, `public/`, `scripts/` et `tests/` à la racine.
4. Aucun nouveau paquet n'est nécessaire. Depuis le terminal du projet :

```powershell
npm run dev
```

Ouvrir `http://localhost:3000/fighters` et faire un rechargement complet avec Ctrl+F5.

Ne pas ajouter les fichiers ZIP à Git. Pour publier, examiner les changements avec `git diff`, puis effectuer le commit et le push depuis le PC. Rien n'a été envoyé sur GitHub ou Vercel depuis cette livraison.

## Vérifications effectuées

- Générateur des 55 planches : chaque image contrôlée (ancrage au sol, transparence, contours, présence de la tête, continuité des boucles).
- 144 tests Jest réussis, dont nouveaux scénarios d'uppercut, de commande arrière et de conservation du raccourci de projectile.
- Typecheck de l'application et des scripts de génération réussi.
- Tests sécurité, motion et contrôle rōmaji réussis ; build Next.js de production réussi.
- Planche de garde des 55 sprites inspectée visuellement.

## Limites de vérification

Le navigateur cloud n'a pas pu atteindre le serveur local. L'outil de prévisualisation de cet environnement impose des options `--host` et `--strictPort` incompatibles avec `next dev`. Aucun navigateur alternatif n'a été utilisé pour contourner ce blocage.

Le rendu réel de la nouvelle interface et son confort tactile restent donc à vérifier sur le PC et un vrai téléphone : recherche, sélection d'équipe, duel, match 3 contre 3, portrait/paysage, mode réduit, pause/reprise et retour au roster. Les photos Supabase réelles n'ont pas été consultées ; les apparences proviennent des photos locales de l'archive.

## Modifier une apparence

Les nouvelles apparences sont dans `scripts/fighters/chars/roster.ts` (id, nom, teint, coiffure, vêtement, couleurs, accessoire). Craig et Melrick conservent leurs propres fichiers.

Les planches et métadonnées sont livrées déjà générées. Pour les régénérer après modification, utiliser une version de Node qui supporte `--experimental-strip-types`, puis :

```powershell
node --experimental-strip-types scripts/fighters/bake-sprites.ts
```

Le script produit les PNG dans `public/fighters/sheets/`, les métadonnées et le manifeste du roster dans `lib/fighters/sheets/`. Livrer ces fichiers générés avec le code.
