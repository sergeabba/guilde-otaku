# Checklist des chantiers

Six colonnes, cochées seulement quand c'est réellement vérifié :

- **Local** : fonctionne en local (build, tests, navigateur Chromium).
- **Fictif** : testé avec des données fictives (dev uniquement, jamais publiées).
- **Réel** : vérifié avec les vraies données (lecture publique accessible d'ici).
- **Visuel** : validé visuellement (captures ordinateur, thème sombre et clair si concerné).
- **Mobile** : validé sur téléphone simulé (320 à 430 px, Chromium).
- **Safari** : validé sur un vrai iPhone. Rien n'est coché tant que tu ne l'as pas fait
  (procédure : `verification-avec-tes-acces.md` et `validation-iphone-safari.md`).

✓ fait · – sans objet · ✗ impossible d'ici (raison dans « Reste »)

| Chantier | Local | Fictif | Réel | Visuel | Mobile | Safari | Reste |
|---|---|---|---|---|---|---|---|
| Navigation (en-tête, menus, sommaire, dock, pied de page) | ✓ | – | ✓ | ✓ | ✓ | | Transitions entre rubriques à affiner |
| Typographie (six registres) | ✓ | – | ✓ | ✓ | ✓ | | Appliquer le registre « étiquette » aux dernières pages |
| Accueil | ✓ | – | ✓ | ✓ | ✓ | | Sections sous la couverture |
| Annuaire (arcanes, liste, compendium) | ✓ | – | ✓ | ✓ | ✓ | | |
| Fiches membres | ✓ | – | ✓ | ✓ | ✓ | | Distinctions et personnalisation des illustrations |
| Scènes de pouvoir | ✓ | – | ✓ | ✓ | ✓ | | Illustrations dédiées (à fournir) |
| Teams (terrain, affiche du choc, lignes) | ✓ | ✓ | ✗ | ✓ | ✓ | | Équipes réelles lues avec la clé de service : à vérifier sur l'aperçu |
| Wanted (classement, affiches) | ✓ | – | ✓ | ✓ | ✓ | | |
| Anniversaires (fête, vœux, astres) | ✓ | – | ✓ | ✓ | ✓ | | |
| Bibliothèque et Chronique du Bash | ✓ | ✓ | ✓ | ✓ | ✓ | | Chroniques réelles ✓ ; fiches de la tier list : lecture publique vide d'ici |
| Cinéma | ✓ | ✓ | ✗ | ✓ | ✓ | | Catalogue réel : `TMDB_API_KEY` dans Vercel |
| Film de la semaine | ✓ | – | ✓ | ✓ | ✓ | | Vote : aucun vote ouvert actuellement |
| Calendrier (programmes, fuseau) | ✓ | – | ✓ | ✓ | ✓ | | |
| Futilités / Atelier | ✓ | ✓ | ✗ | ✓ | ✓ | | Galerie réelle lue avec la clé de service |
| Bons Plans (officiel / partagé) | ✓ | – | ✓ | ✓ | ✓ | | |
| Jeux (identités par borne) | ✓ | – | ✗ | ✓ | ✓ | | Parties complètes : sources externes inaccessibles d'ici |
| Administration (mobile, confirmations, aperçus) | ✓ | ✓ | ✗ | ✓ | ✓ | | Ta vraie session : procédure dédiée |
| Fighters | En pause | | | | | | Références en pied attendues (sprites) |
| Phase 5 : Quartier général (/qg) | ✓ | – | ✓ | ✓ | ✓ | | Équipes et galerie réelles lues avec la clé de service (vestiaire et chevalet à vérifier sur l'aperçu) |
| Phase 5 : Musée, Archives, Cartes, Cérémonies | Non commencé | | | | | | Ordre dans `phase-5-univers.md` |
