# Contribuer à filrouge

Merci de votre intérêt ! Quelques règles pour garder le projet sûr et cohérent.

## Principes

Lire la section « Principes non négociables » de [ROADMAP.md](./ROADMAP.md). En résumé :

- aucun backend, aucune requête réseau sortante sans opt-in explicite signalé dans l'UI ;
- toute donnée saisie ou importée est hostile : validation Zod, rendu assaini, `dangerouslySetInnerHTML` interdit ;
- les composants n'accèdent jamais directement à Dexie (passer par `src/db/repositories` et les stores) ;
- la logique métier (`src/domain`, `src/lib`) reste pure et testée sans DOM.

## Workflow

1. Une tâche de la roadmap à la fois, dans l'ordre.
2. Respecter la « Definition of Done » (§5 de la roadmap).
3. Avant de pousser : `bun run lint && bun run format:check && bun run typecheck && bun run test`.
4. Commits au format [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`…).

## Nouvelle dépendance

Justifier son ajout dans la PR et vérifier qu'elle n'effectue **aucun appel réseau au runtime**
(polices, icônes, analytics, CDN…).
