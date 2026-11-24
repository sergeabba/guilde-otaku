---
name: fighters-studio
description: Méthode de studio de jeu pour la page Fighters de Guilde Otaku (jeu de combat MUGEN-like, lib/fighters, app/fighters) - guide du genre combat, contrôle d'équilibrage des données de coups, test de jeu automatisé et grille de compte rendu. À utiliser avant de modifier ou d'ajouter des coups, personnages, arènes, IA, commandes ou sensations de jeu dans Fighters.
---

# Fighters : méthode de studio

D'après Claude Code Game Studios (Donchitos, MIT, voir LICENSE et SOURCE.md), réduit à ce
qui sert un jeu de combat déjà construit dans un site Next.js.

## 1. Le guide du genre

Lire `references/genre-fighting.md` (et `genre-beat-em-up.md` pour un mode foule). Chaque
réglage du jeu se juge contre ses règles « Feel » et « Card defaults » :
- léger immédiat, lourd qui engage et punissable en garde ;
- commandes tolérantes (petites erreurs de quart de cercle pardonnées, tampon de saisie) ;
- les combattants se font face ; reculer = garde, avec son et petit recul ;
- IA à niveau choisi, qui réagit avec un délai humain et ne lit jamais une touche à l'avance ;
- liste des coups dans la pause, raccourci d'une touche pour chaque spéciale ;
- barres miroir, minuteur, deux manches gagnantes.
Une règle qu'on enfreint exprès est écrite dans le commentaire du code concerné, avec la raison.

## 2. Où sont les choses

- Moteur pur et déterministe : `lib/fighters/engine.ts` (60 images/s, `step(state, p1, p2)`).
- Données des coups et personnages : `lib/fighters/characters.ts` (images de démarrage,
  actives, récupération, blocage, dégâts, zones). Planches : `lib/fighters/sheets/`.
- IA : `lib/fighters/ai.ts` (elle appuie sur les mêmes touches qu'un joueur, sans triche).
- Manette : `lib/fighters/gamepad.ts`. Son : `audio.ts`. Arènes : `stages.ts`. Rendu : `render.ts`.
- Écrans : `app/fighters/FightersApp.tsx` (menus, roster), `FightScreen.tsx` (combat, pause).
- Règles du site : aucune spéciale inventée, seules celles des fiches des membres
  (sinon « provisoire ») ; rōmaji seulement ; sprites originaux, rien repris d'un jeu existant.

## 3. Équilibrage (balance-check)

`npx jest tests/fighters-balance.test.ts` vérifie les règles mesurables :
avantage en garde = `blockstun - (active - 1 + recovery)` ; aucun coup au sol positif en
garde, lourds à -4 ou moins, spéciales et super de contact punissables (< -6), légers plus
rapides et moins forts que les lourds, projection rapide mais risquée.
Toute nouvelle donnée de coup passe ce test ; un écart voulu y est ajouté avec sa raison.
Pour un nouveau personnage, comparer ses valeurs aux coups communs : un écart de plus de
20 % sur les dégâts ou de plus de 2 images sur le démarrage se justifie par sa fiche.

## 4. Test de jeu automatisé (smoke check)

Avec la skill `guilde-qa` (faux Supabase, serveur local) puis Playwright :
1. ouvrir `/fighters`, lancer un combat contre l'IA ;
2. envoyer une suite de touches fixe (avancer, poing léger x3, quart de cercle + poing,
   garde 1 s, saut + pied fort) pendant 20 s ;
3. vérifier : aucune erreur JS, les barres de vie bougent, le combo s'affiche, la pause
   (Échap) fige le jeu et la reprise repart ; captures ordinateur et téléphone (commandes
   tactiles visibles, rien sous la barre du bas).
Le moteur étant déterministe, un combat IA contre IA avec la même graine
(`makeRng(seed)`) doit donner le même vainqueur : bon test de non-régression.

## 5. Compte rendu (playtest-report)

Après chaque changement : ce qui a été joué (mode, personnages, niveau d'IA), ce qui
marche, ce qui reste cassé, ce qui a été deviné, et la mention « pas encore joué par une
personne » tant que l'utilisateur ne l'a pas essayé.

## Plus tard (jamais en une seule fois)

Selon le guide : mode entraînement avec affichage des touches, échelle arcade avec une
histoire par combattant, combos longs, versus en ligne (demande un serveur).
