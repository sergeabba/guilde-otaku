# Checklist des chantiers

États : Non commencé · En cours · Fonctionnel · Validé visuellement · Validé sur mobile · Terminé.
« Validé sur mobile » = Chromium (simulation iPhone). Safari réel : voir
`validation-iphone-safari.md`, rien n'y est coché tant que tu ne l'as pas vérifié.

| Chantier | État | Ce qui manque |
|---|---|---|
| Accueil (couverture, entrées, mobile) | Validé sur mobile | Interactions entrées/personnages plus riches ; sections sous la couverture |
| Fiches membres (vue Personnage) | Validé sur mobile | Composition du nom sans plaque (Godwin) ; tests portraits clairs/sombres/non détourés |
| Scènes de pouvoir (spéciale, bankai, territoire) | Fonctionnel | Qualité d'illustration (illustrations dédiées, shader de matière) |
| Admin : réglages des scènes de pouvoir | Fonctionnel | Aperçu en direct ; test de sauvegarde avec données factices |
| Annuaire (arcanes, liste) | Validé sur mobile | — |
| Teams (terrain, capitaine, écussons, annonce) | Validé visuellement (données de test) | Confrontations, affiches de match, fiches joueurs |
| Wanted | Validé sur mobile | Finition |
| Anniversaires | Validé visuellement | — |
| Bibliothèque | Validé sur mobile | Fiches réelles : la lecture publique de la table renvoie 0 fiche, collection vérifiée avec données factices de dev (`?demo=fiches`) |
| Chronique du Bash | Validé sur mobile | Couverture de numéro, dossier en cases, programme par date, numéros précédents, article avec bandeau et lettrine |
| Cinéma | Validé sur mobile | Deux états testés (relâche sans TMDB ; catalogue factice de dev `?demo=catalogue`). En production : ajouter `TMDB_API_KEY` dans Vercel |
| Film de la semaine | Validé sur mobile | Vote intégré à la page (s'affiche quand un vote existe ; aucun vote ouvert dans les données actuelles) |
| Calendrier | Validé sur mobile | Vue jour en ligne horaire (repère « maintenant »), vue semaine en grille de programmation (ordinateur) |
| Futilités / Atelier | Validé sur mobile | Salles par univers, cartels ; galerie réelle non lisible ici (clé de service), testée avec `?demo=galerie` (images de public/atelier) |
| Bons Plans | Validé sur mobile | Accès direct par nom, rayons numérotés, affiche typographique du dernier ajout |
| Administration (ergonomie mobile) | Non commencé | — |
| Jeux (salle, lancement) | Fonctionnel | Logos et identités par jeu ; parties complètes testées |
| Fighters : styles, techniques signature, IA | Fonctionnel | Tests de jouabilité réels |
| Fighters : équilibrage | Fonctionnel | Plus de simulations ; matrice avantages/faiblesses |
| Fighters : interface de combat v2 | Validé visuellement | Mobile paysage à confirmer sur Safari |
| Fighters : incrustation des supers | Fonctionnel | Effets PixelFX propres aux pouvoirs |
| Fighters : sprites des 4 combattants | En attente de références | Voir `docs/fighters/commande-sprites-tranche-1.md` |
| Fighters : arènes (2 magnifiques) | Non commencé | — |
| Fighters : sélection et écran VS v2 | En cours | Recomposition (illustrations dominantes) |
| Fighters : écran titre et logo | Non commencé | — |
| Phase 5 : nouvelles expériences | Non commencé | Choix des 2 ou 3 concepts |
