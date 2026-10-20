# CLAUDE.md

Guide pour les agents de développement travaillant sur filrouge.

- Référence produit et ordre des tâches : `ROADMAP.md` (une tâche à la fois, cocher la case une fois la DoD remplie).
- Gestionnaire de paquets : Bun (version épinglée dans `packageManager`). Les outils (Vite, Vitest,
  Playwright) tournent sous Node via `bun run`. Attention : `bun test` lance le runner de Bun, pas Vitest.
- Vérifications obligatoires : `bun run lint && bun run format:check && bun run typecheck && bun run test`
  (+ `bun run test:e2e` pour les parcours UI).
- Commits : Conventional Commits, un commit par tâche de la roadmap.
- Les agents n'ont pas le droit de commiter, c'est l'utilisateur qui le fait : les commits sont signés en SSH (`~/.ssh/github`, protégée par passphrase)
  et, sans terminal pour la saisir, `git commit` reste bloqué. L'agent laisse les changements dans l'arbre
  de travail (vérifications au vert), coche les tâches, puis propose le message de commit Conventional
  Commits du groupe terminé. L'utilisateur commite. L'agent poursuit sans attendre le commit.

## Architecture

- `src/domain/` : schémas Zod (source de vérité des types), types d'entités, migrations. Pur, sans DOM.
- `src/db/` : Dexie + repositories. Seuls les repositories touchent Dexie.
- `src/store/` : stores Zustand. L'enquête ouverte est chargée en mémoire ; les modifications sont
  persistées par une sauvegarde debouncée (`src/store/persistence.ts`).
- `src/features/<feature>/` : composants et hooks par fonctionnalité.
- `src/components/ui/` : composants shadcn/ui générés (`bunx shadcn@latest add <name>`).
- `src/lib/` : utilitaires purs.

## Règles

- Jamais `dangerouslySetInnerHTML` (règle ESLint) ; Markdown via `src/lib/markdown.tsx` uniquement.
- Aucune requête réseau au runtime ; la CSP (dans `vite.config.ts`) doit rester stricte.
- Ne jamais logguer le contenu d'une enquête (`no-console` actif, sauf warn/error).
- Toute donnée importée passe par un schéma Zod avant d'atteindre le store.
- Toute nouvelle action de la barre d'outils du graphe doit aussi figurer dans le menu « Plus d'actions » de la barre compacte (`compact-graph-toolbar.tsx`, écrans étroits).
- Changement du modèle : incrémenter `SCHEMA_VERSION` et ajouter une migration testée.
