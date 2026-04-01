# ✅ TODO — Améliorations Guilde Otaku

## Fichiers améliorés

- [x] `next.config.ts` — Optimisation images (avif/webp), remotePatterns Supabase/AniList/TMDB, compress, optimizePackageImports
- [x] `lib/supabase.ts` — MockQueryBuilder class-based avec toutes les méthodes chaînables (eq, neq, gt, gte, lt, lte, like, ilike, in, is, order, limit, range, single, update, upsert)
- [x] `app/types/index.ts` — Ajout FighterStats, SpecialAttack, BiblioEntry, AtelierItem, SupabaseMemberRow, SupabaseBiblioRow, SupabaseAtelierRow + helpers getDaysUntil, isTodayBirthday, formatBirthdayDisplay
- [x] `app/utils/dataAdapter.ts` — Typage strict (SupabaseMemberRow), cache mémoire TTL 5min, retry avec backoff exponentiel, fetchMemberById, invalidateMembersCache
- [x] `app/hooks/useIsMobile.ts` — useMediaQuery générique, useIsMobile, useIsTablet, useBreakpoint, usePrefersReducedMotion + BREAKPOINTS constants
- [x] `app/components/BirthdayBanner.tsx` — Typage strict BirthdayMember, role="alert" + aria-live="polite" + aria-atomic, select optimisé (id,name,birthday), isTodayBirthday centralisé
- [x] `app/components/MemberModal.tsx` — Fix placeholder (/placeholder.svg), role="dialog" + aria-modal + aria-labelledby, aria-pressed sur mode buttons, focus trap (closeButtonRef), gestion erreur image par état local, Escape ferme badge splash
- [x] `app/globals.css` — @layer utilities (scrollbar-hide, touch-pan, will-change), classes .glass/.glass-dark/.glass-gold, .font-guilde/.font-bebas, .title-guilde, animations fade-in-up/scale-in/slide-right/bounce-in, .animate-* utilitaires

## Suivi

- [x] Tous les fichiers principaux améliorés
- [x] Compilation TypeScript : **0 erreur** (`npx tsc --noEmit` → succès)
- [x] Tests Jest : **2/2 PASS** (`npm test` → ✅ rank accents)
- [x] Dépendances Jest installées : `jest`, `ts-jest`, `@types/jest`
- [x] `tsconfig.test.json` créé (types Jest isolés des types Next.js)
- [x] `jest.config.js` mis à jour (tsconfig dédié + moduleNameMapper)
- [ ] Tester visuellement dans le navigateur (`npm run dev`)

## Résumé des améliorations

### 🚀 Performance
- Cache mémoire TTL 5min dans dataAdapter (évite les refetch inutiles)
- Retry automatique avec backoff exponentiel (2 tentatives)
- select("id,name,birthday") dans BirthdayBanner au lieu de select("*")
- Image optimization Next.js (avif/webp, deviceSizes, remotePatterns)

### 🔒 TypeScript
- Suppression de tous les `any` dans dataAdapter, BirthdayBanner
- Types partagés centralisés dans app/types/index.ts
- Interfaces Supabase raw rows (SupabaseMemberRow, SupabaseBiblioRow, SupabaseAtelierRow)
- Mapper typé mapRowToMember() dans dataAdapter

### ♿ Accessibilité
- role="dialog" + aria-modal + aria-labelledby sur MemberModal
- role="alert" + aria-live="polite" + aria-atomic sur BirthdayBanner
- aria-pressed sur les boutons de mode (Réel/Anime)
- role="group" + aria-label sur le switch de mode
- Focus trap : focus automatique sur le bouton fermer à l'ouverture
- Escape ferme le badge splash avant de fermer la modal
- aria-hidden="true" sur toutes les icônes décoratives

### 🎨 CSS / Design System
- Classes .glass, .glass-dark, .glass-gold pour l'effet Liquid Glass
- Classes .font-guilde, .font-bebas, .title-guilde
- Animations CSS : fade-in-up, fade-in, scale-in, slide-in-right, bounce-in
- @layer utilities Tailwind : scrollbar-hide, touch-pan-x/y, will-change-transform/opacity
- .text-balance, .text-pretty pour le wrapping typographique

### 🪝 Hooks
- useMediaQuery(query) — hook générique réutilisable
- useIsTablet() — détection tablette
- useBreakpoint() — retourne le breakpoint actif (xs/sm/md/lg/xl/2xl)
- usePrefersReducedMotion() — accessibilité animations
- BREAKPOINTS constants exportées (cohérentes avec Tailwind)
