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

Prérequis : [Bun](https://bun.sh) ≥ 1.2 et Node.js ≥ 22 (utilisé par Vite, Vitest et Playwright).

```bash
bun install
bun run dev       # http://localhost:5173
```

| Commande                          | Rôle                                                                  |
| --------------------------------- | --------------------------------------------------------------------- |
| `bun run build`                   | build de production dans `dist/` (CSP injectée)                       |
| `bun run lint` / `bun run format` | ESLint / Prettier                                                     |
| `bun run typecheck`               | vérification TypeScript stricte                                       |
| `bun run test`                    | tests unitaires (Vitest ; pas `bun test`, qui lance le runner de Bun) |
| `bun run test:e2e`                | tests E2E (Playwright, sur le build de production)                    |

## Déploiement

Le workflow `.github/workflows/deploy.yml` publie `dist/` sur GitHub Pages à chaque push sur `main`.

**Utilisez un domaine (ou sous-domaine) dédié** (Settings › Pages › Custom domain). IndexedDB est isolé
par origine : servie depuis `<user>.github.io/filrouge`, l'application partagerait son origine – donc ses
données – avec tous les autres sites Pages du même compte. Pour un sous-chemin malgré tout, construire avec
`FILROUGE_BASE=/filrouge/ bun run build`.

## Sécurité

Voir [SECURITY.md](./SECURITY.md).

## Licence

[MIT](./LICENSE)
