# Vérifier ce qui demande tes accès (10 minutes)

Certaines fonctions lisent ou écrivent des données avec la clé de service (côté serveur,
dans Vercel) ou demandent ta session d'administration. Je ne peux pas les voir d'ici et
je ne contourne aucune protection. Voici comment les vérifier toi-même, sans rien
partager dans la conversation.

## 1. Ouvrir l'aperçu

1. Connecte-toi à Vercel dans ton navigateur (téléphone ou ordinateur).
2. Ouvre l'aperçu de la branche : `https://guilde-otaku-git-apercu-guilde-donsergios-projects.vercel.app`
3. Si une page de connexion Vercel apparaît, connecte-toi : c'est la protection de
   l'aperçu, elle reste active.

## 2. Pages publiques à regarder (données réelles)

| Page | Ce qui doit apparaître |
|---|---|
| `/teams` | Tes équipes publiées, l'affiche du choc s'il y a deux équipes du même sport, les notes par ligne |
| `/atelier` | Ta galerie réelle, les salles par univers (si au moins deux œuvres partagent un univers) |
| `/bibliotheque` | La collection (tier list) avec tes fiches, sous le magazine |
| `/cinema` | Le catalogue (affiche, rangées) si `TMDB_API_KEY` est configurée ; sinon l'écran « Relâche ce soir » |
| `/jeux` | Lance deux ou trois bornes jusqu'au bout : score, badge, rejouer |

## 3. Administration (ta session)

1. Ouvre `/admin` et connecte-toi avec ton mot de passe (dans le formulaire du site,
   jamais dans la conversation).
2. Sur téléphone, vérifie : le tableau de bord en deux colonnes, le bouton « Changer de
   rubrique », les listes et les filtres.
3. Membres → choisis un membre → onglet Portraits → « Scènes de pouvoir » → bouton
   « Aperçu » : la scène s'affiche en direct. **Ne clique pas sur Enregistrer** si tu ne
   veux rien changer : « Fermer » abandonne les modifications.
4. Toute suppression ouvre une confirmation : vérifie que « Annuler » ne supprime rien.

## 4. Clés à configurer (dans Vercel, jamais ici)

Vercel → ton projet → Settings → Environment Variables :

- `TMDB_API_KEY` : catalogue du Cinéma et logos de séries.
- (facultatif) `GOOGLE_DRIVE_API_KEY` : durées et descriptions des vidéos.

Après ajout, redéploie l'aperçu (Deployments → … → Redeploy).

## 5. Me faire un retour

Envoie-moi des captures (même imparfaites) avec la page et ce qui ne va pas. Je corrige
à partir de ce que tu vois réellement.
