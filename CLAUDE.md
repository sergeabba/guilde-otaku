## Approach
- Read existing files before writing. Don't re-read unless changed.
- Thorough in reasoning, concise in output.
- Skip files over 100KB unless required.
- No sycophantic openers or closing fluff.
- No emojis or em-dashes.
- Do not guess APIs, versions, flags, commit SHAs, or package names. Verify by reading code or docs before asserting.

## Skills du projet (.claude/skills)
- Interface ou CSS : charger `guilde-design` d'abord (tokens, composants, règles rōmaji) au lieu de relire `app/styles/shonen.css`.
- Direction visuelle d'une nouvelle page : `frontend-design` (Anthropic). Relecture : `web-design-guidelines` (copie locale figée).
- Code React/Next.js : `vercel-react-best-practices`, `vercel-composition-patterns` (lire seulement les fichiers `rules/` utiles).
- Vérifier : `guilde-qa` (faux Supabase en lecture seule, captures, tests, build).
- Économie de tokens : `caveman` (réponses compressées), `cavecrew` (délégation compacte).
