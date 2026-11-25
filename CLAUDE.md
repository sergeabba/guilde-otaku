## Approach
- Read existing files before writing. Don't re-read unless changed.
- Thorough in reasoning, concise in output.
- Skip files over 100KB unless required.
- No sycophantic openers or closing fluff.
- No emojis or em-dashes.
- Do not guess APIs, versions, flags, commit SHAs, or package names. Verify by reading code or docs before asserting.

## Skills du projet (.claude/skills)
- **Point d'entrée design, mouvement et jeu : `guilde-studio`** (routeur : quel skill pour quelle tâche, priorités, politique technique, références). Bibliothèque à la demande : `.claude/skill-library/INDEX.md`.
- Interface ou CSS : charger `guilde-design` d'abord (tokens, composants, règles rōmaji) au lieu de relire `app/styles/shonen.css`.
- Direction visuelle d'une nouvelle page : `frontend-design` (Anthropic). Relecture : `web-design-guidelines` (copie locale figée).
- Regard critique sur le goût (mise en page, mouvement, textes) : `design-taste-frontend` (taste-skill, copie allégée, voir son `SOURCE.md`). `guilde-design` l'emporte en cas de conflit.
- Effet animé (texte, fond, curseur, micro-interaction) : `react-bits` (catalogue React Bits, récupération sur GitHub, adaptation au site) avant d'en coder un.
- Jeu Fighters (coups, personnages, IA, commandes, sensations) : `fighters-studio` (guide du genre combat, test d'équilibrage, test de jeu).
- Code React/Next.js : `vercel-react-best-practices`, `vercel-composition-patterns` (lire seulement les fichiers `rules/` utiles).
- Vérifier : `guilde-qa` (faux Supabase en lecture seule, captures, tests, build).
- Économie de tokens : `caveman` (réponses compressées), `cavecrew` (délégation compacte).
- Méthode de travail : skills `superpowers` (copiées du dépôt obra/superpowers, voir `.claude/skills/using-superpowers/SOURCE.md`) : `brainstorming` avant une nouvelle fonctionnalité, `writing-plans` puis `executing-plans`, `systematic-debugging` pour un bug, `test-driven-development`, `verification-before-completion` avant d'annoncer un résultat.
