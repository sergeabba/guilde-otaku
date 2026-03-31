# 🛡️ Guilde Otaku - Documentation du Projet

Bienvenue dans la documentation officielle de la **Guilde Otaku**. Ce projet est une plateforme communautaire interactive (Trombinoscope / Hub) conçue pour centraliser les membres, leurs exploits, leurs créations artistiques et les critiques de mangas/animes du groupe.

---

## 🚀 Stack Technique

Le projet utilise les dernières technologies web pour une expérience fluide et ultra-visuelle :

- **Framework** : [Next.js 16 (App Router)](https://nextjs.org/)
- **Langage** : [TypeScript](https://www.typescriptlang.org/)
- **Interface & Rendu** : [React 19](https://react.dev/)
- **Stylisation** : [Tailwind CSS 4](https://tailwindcss.com/) (pour le système de design moderne)
- **Animations** : [Framer Motion](https://www.framer.com/motion/) (pour les transitions fluides et les effets "Liquid Glass")
- **Base de Données** : [Supabase](https://supabase.com/) (PostgreSQL & Authentification)
- **Icônes** : [Lucide React](https://lucide.dev/)

---

## 📂 Structure du Code

Voici l'organisation principale du répertoire `/app` :

```text
app/
├── admin/              # Dashboard de commande (Hub central)
├── admin-*/            # Pages d'administration spécifiques (Biblio, Atelier, Fighters, Membres)
├── api/                # Endpoints backend (Migrations, mises à jour de données)
├── atelier/            # Galerie d'Art générée par IA
├── bibliotheque/       # La "Chronique du Bash" (Critiques Mangas/Animes)
├── birthdays/          # Suivi des anniversaires des membres
├── fighters/           # Fiches détaillées des combattants de la Guilde
├── components/         # Composants React réutilisables (Header, MemberCard, etc.)
├── config/             # Configuration des rangs et thèmes visuels
├── lib/                # Client Supabase et utilitaires partagés
└── data/               # Données statiques (utilisées pour l'initialisation/fallback)
```

---

## ✨ Fonctionnalités Clés

### 1. Le Trombinoscope (Accueil)
- **Double Vue** : Possibilité de switcher entre le mode "Réel" (photos) et le mode "Anime" (avatars).
- **Filtrage par Rang** : Tri dynamique des membres par niveau (Guerrier, Sage, Maître, etc.).
- **Recherche** : Filtrage en temps réel par nom.
- **Effets Visuels** : Fond en "Mesh Gradient" animé et animations d'entrée Framer Motion.

### 2. Le Commandement Otaku (Admin)
- **Accès Sécurisé** : Interface protégée par un code secret (`1111` par défaut).
- **Gestion Temps Réel** : Modification directe de la base de données Supabase pour les membres, les articles et la galerie d'images.
- **Migration** : Scripts API (`/api/migrate-fighters`) pour synchroniser les fichiers locaux avec la base de données.

### 3. L'Atelier de la Guilde
- **Showcase IA** : Galerie dédiée aux créations artistiques générées par Intelligence Artificielle.
- **Grille Dynamique** : Mise en page adaptative gérée via l'administration.

### 4. La Chronique du Bash
- **Espace Critique** : Dossiers et verdicts définitifs sur les mangas et animes.
- **Intégration Accueil** : Bannière promotionnelle pour les derniers verdicts.

---

## 💾 Base de Données (Supabase)

Le projet repose sur plusieurs tables clés (schéma indicatif) :
- `fighters` : Stocke les noms, bios, anniversaires, stats et URLs des photos des membres.
- `atelier` : Gère les métadonnées des images de la galerie d'art (titre, description, prompts).
- `bibliotheque` : Contient les critiques et les métadonnées des œuvres.

---

## 🛠️ Installation et Développement

1. **Installation des dépendances** :
   ```bash
   npm install
   ```

2. **Variables d'environnement** :
   Créez un fichier `.env.local` avec vos clés Supabase :
   ```env
   NEXT_PUBLIC_SUPABASE_URL=votre_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
   ```

3. **Lancement du serveur** :
   ```bash
   npm run dev
   ```
   Le site sera accessible sur `http://localhost:3000`.

---

## 🎨 Philosophie de Design
Le projet suit une esthétique **"Premium Liquid Glass"** :
- **Transparence** : Utilisation intensive de `backdrop-filter: blur()`.
- **Espaces** : Layouts aérés inspirés d'Apple.
- **Typographie** : Utilisation de polices fortes comme *Barlow Condensed* et *Bebas Neue*.
- **Réactivité** : Entièrement optimisé pour mobile avec des hooks dédiés (`useIsMobile`).

---
*Document généré par l'IA Antigravity pour la Guilde Otaku.*
