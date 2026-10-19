# filrouge

**filrouge** est une application web 100 % statique, local-first et open source pour relier visuellement
les trouvailles d'une enquête OSINT : entités, liens, sources et niveaux de confiance.

> Aucune donnée d'enquête ne quitte votre navigateur. Pas de backend, pas de télémétrie, pas de CDN.

## Fonctionnalités (v0.1)

- Plusieurs enquêtes, stockées dans IndexedDB
- Graphe éditable : entités typées (personne, alias, email, domaine, IP…), relations libellées
- Panneau de détail : label, propriétés, tags, notes Markdown (rendu assaini)
- Sauvegarde automatique, y compris les positions
- Export / import JSON versionné et validé

Feuille de route complète : [ROADMAP.md](./ROADMAP.md).

## Démarrer

Prérequis : Node.js ≥ 22 et pnpm (via `corepack enable`).

```bash
pnpm install
pnpm dev          # http://localhost:5173
```

| Commande                    | Rôle                                               |
| --------------------------- | -------------------------------------------------- |
| `pnpm build`                | build de production dans `dist/` (CSP injectée)    |
| `pnpm lint` / `pnpm format` | ESLint / Prettier                                  |
| `pnpm typecheck`            | vérification TypeScript stricte                    |
| `pnpm test`                 | tests unitaires (Vitest)                           |
| `pnpm test:e2e`             | tests E2E (Playwright, sur le build de production) |

## Déploiement

Le workflow `.github/workflows/deploy.yml` publie `dist/` sur GitHub Pages à chaque push sur `main`.

**Utilisez un domaine (ou sous-domaine) dédié** (Settings › Pages › Custom domain). IndexedDB est isolé
par origine : servie depuis `<user>.github.io/filrouge`, l'application partagerait son origine — donc ses
données — avec tous les autres sites Pages du même compte. Pour un sous-chemin malgré tout, construire avec
`FILROUGE_BASE=/filrouge/ pnpm build`.

## Sécurité

Voir [SECURITY.md](./SECURITY.md).

## Licence

[MIT](./LICENSE)
