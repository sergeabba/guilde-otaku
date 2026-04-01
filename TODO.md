# Fix Dossier du Bash - Cover Images

## Plan
- [x] Create TODO
- [ ] Improve `lib/cover-fetch.ts`
  - [ ] Add `fetchFromAniListById(id)` function
  - [ ] Improve `cleanSearchQuery` to be less aggressive
  - [ ] Add title similarity validation in `fetchFromAniList`
  - [ ] Add fallback search without type restriction
- [ ] Fix `DOSSIER_BASH_DATA` in `app/bibliotheque/page.tsx`
  - [ ] Add `anilistId` field to entries
  - [ ] Fix wrong `searchQuery` values
  - [ ] Hardcode covers for hard-to-find entries
  - [ ] Update `fetchDossierCovers` to use `anilistId` first
- [ ] Test in browser
