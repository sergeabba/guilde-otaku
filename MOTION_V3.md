# Guilde Otaku V3 — édition Motion & Mobile (13 novembre 2026)

## Objectif

Poursuivre la DA **magazine shōnen** existante, sans répliquer le style visuel de LBFC ou de Nsoley Portfolio. Les références inspirent la narration au défilement, la hiérarchie typographique, les transitions coordonnées et une ergonomie plus directe sur téléphone.

## Modifications livrées

1. **Accueil** : une bande typographique façon manga et une scène en **trois chapitres** reliant l'annuaire, Fighters et la Bibliothèque. Sur ordinateur, la scène est épinglée pendant le scroll ; sur téléphone ou avec réduction des animations, elle devient un parcours horizontal natif et tactile.
2. **Navigation mobile** : dock de cinq commandes (Guilde, Wanted, Fighters, Bibliothèque, Sommaire), indication de la rubrique courante, respect des marges de sécurité des téléphones. L'arène Fighters conserve son interface plein écran sans dock.
3. **Révélations éditoriales** : arrivée progressive des sections de **Membres, Anniversaires, Wanted, Film de la semaine, Bibliothèque, Bons plans et Atelier**, seulement quand elles entrent dans le champ. Fighters conserve ses propres animations de combat. Le contenu reste visible sans JavaScript.
4. **Atelier** : passage d'une esthétique néon/halo à des finitions plus encrées et dorées. Les œuvres sont ouvrables au clavier, le dialogue est identifié pour les technologies d'assistance et les images se parcourent au swipe sur mobile. Les compteurs affichés sont dérivés des contenus présents.
5. **Confort** : préférences `prefers-reduced-motion`, retour d'information au clavier, contrôle d'accès à la recherche via le menu, barre de progression de lecture dans les navigateurs compatibles, filtres horizontaux utilisables sur petits écrans.
6. **Entrée sur le site** : introduction vidéo non bloquante pour les visiteurs mobiles et les visiteurs de retour ; intro bureau **passable** avec un bouton. Pas d'activation du son sans choix explicite.
7. **Performance** : scrolling natif conservé, transitions légères sur `transform` et `opacity`, pas de dépendance GSAP/Lenis ajoutée, fontes secondaires sans préchargement systématique.

## Fichiers importants

- `app/styles/motion.css` : règles et micro-interactions.
- `app/components/MotionDirector.tsx` : observateur progressif et progression de lecture.
- `app/components/ChapterStory.tsx` : scène en trois actes de l'accueil.
- `app/components/MotionSettings.tsx` : paramètres de réduction des animations.
- `app/components/GuildeHeader.tsx` : navigation responsive.
- `app/components/SplashWrapper.tsx` et `app/components/FairyTailSplash.tsx` : introduction non bloquante/passable.
- `tests/motion-ux.node.mjs` : garde-fous statiques.

## Installation sur Windows / VS Code

**Avant toute installation**, vérifier que `git status --short` est vide, puis sauvegarder le projet ou faire un commit de sécurité.

- **ZIP correctifs** : extraire à la racine du projet `D:\trombinoscope` avec remplacement des fichiers, après avoir vérifié le contenu de l'archive.
- **ZIP complet** : copie consolidée contenant aussi les corrections d'authentification de la livraison précédente. L'extraire dans un **dossier distinct** pour comparer avant de remplacer votre projet.

Dans le projet :

```powershell
npm install
npm run test:motion
npm run test:security
npm run dev
```

Pour préparer la production :

```powershell
npm run lint
npm run build
```

Vérifier localement les routes `/`, `/birthdays`, `/wanted`, `/fighters`, `/film-semaine`, `/bibliotheque`, `/bons-plans`, `/atelier`, à **320 / 375 / 390 / 768 / 1024 / 1440 px** ainsi que sur un vrai téléphone. Tester navigation tactile, orientation, focus clavier, préférences de réduction des animations et confort de défilement. Ne déployer sur Vercel qu'après validation.

## Vérification effectuée ici

- `npm run test:motion` : **6/6 tests passent**.
- `npm run test:security` : **2/2 tests passent**.
- Analyse syntaxique TypeScript : **14 fichiers TSX sans erreurs de syntaxe** (ce n'est PAS une validation complète de typage).
- CSS : **deux fichiers analysés sans erreurs de parsing**.

**Non vérifiés** : `npm run build`, `npm run lint`, les interactions exécutées dans Next.js et les captures visuelles en navigateur. Le registre npm n'était pas disponible dans cet environnement (`EAI_AGAIN` lors du test), et une tentative locale de navigateur headless n'a pas produit de capture exploitable. Il serait donc inexact d'affirmer un score Lighthouse, l'absence de bugs responsive ou une fluidité mesurée. Les tests sur votre ordinateur restent nécessaires.

## Sécurité

Cette livraison complète conserve les correctifs de session d'administration décrits dans `REPRISE_V3.md`. Il faut définir `ADMIN_PASSWORD` (robuste) et de préférence `ADMIN_SESSION_SECRET` dans l'environnement **avant déploiement**. Vérifier également les politiques RLS de Supabase ; les anciens écrans d'admin comportent encore des écritures directes côté client. Aucun déploiement ni modification Supabase distante n'a été effectué.
