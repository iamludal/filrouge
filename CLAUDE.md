# CLAUDE.md

Guide pour les agents de développement travaillant sur filrouge.

- Référence produit et ordre des tâches : `ROADMAP.md` (une tâche à la fois, cocher la case une fois la DoD remplie).
- Gestionnaire de paquets : pnpm (version épinglée dans `packageManager`, via corepack).
- Vérifications obligatoires : `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test`
  (+ `pnpm test:e2e` pour les parcours UI).
- Commits : Conventional Commits, un commit par tâche de la roadmap.

## Architecture

- `src/domain/` : schémas Zod (source de vérité des types), types d'entités, migrations. Pur, sans DOM.
- `src/db/` : Dexie + repositories. Seuls les repositories touchent Dexie.
- `src/store/` : stores Zustand. L'enquête ouverte est chargée en mémoire ; les modifications sont
  persistées par une sauvegarde debouncée (`src/store/persistence.ts`).
- `src/features/<feature>/` : composants et hooks par fonctionnalité.
- `src/components/ui/` : composants shadcn/ui générés (`pnpm dlx shadcn@latest add <name>`).
- `src/lib/` : utilitaires purs.

## Règles

- Jamais `dangerouslySetInnerHTML` (règle ESLint) ; Markdown via `src/lib/markdown.tsx` uniquement.
- Aucune requête réseau au runtime ; la CSP (dans `vite.config.ts`) doit rester stricte.
- Ne jamais logguer le contenu d'une enquête (`no-console` actif, sauf warn/error).
- Toute donnée importée passe par un schéma Zod avant d'atteindre le store.
- Changement du modèle : incrémenter `SCHEMA_VERSION` et ajouter une migration testée.
