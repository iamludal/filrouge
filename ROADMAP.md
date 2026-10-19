# ROADMAP — filrouge

> **filrouge** est une application web **100 % statique**, **local-first** et open source pour relier visuellement
> les trouvailles d'une enquête OSINT : entités, liens, sources et niveaux de confiance.
> Aucune donnée d'enquête ne quitte le navigateur de l'utilisateur.

Ce document sert de référence de développement. Les jalons sont à traiter **dans l'ordre**,
une tâche à la fois. Chaque tâche n'est terminée que si sa « Definition of Done » est respectée.

---

## 1. Principes non négociables

1. **Local-first** : aucun backend. Toutes les données vivent dans IndexedDB.
2. **Zéro fuite** : pas de télémétrie, pas d'analytics, pas de script tiers, pas de CDN au runtime.
   Toute requête réseau sortante (tuiles de carte, favicon distant…) doit être **opt-in** et signalée dans l'UI.
3. **Données hostiles** : tout contenu importé ou saisi (labels, notes, URLs, fichiers JSON) est considéré comme
   potentiellement malveillant. Il est validé avec Zod et assaini avant tout rendu HTML (DOMPurify).
   `dangerouslySetInnerHTML` est interdit, sauf derrière DOMPurify.
4. **Traçabilité** : chaque entité et chaque relation peut être rattachée à une ou plusieurs sources.
5. **Modèle versionné** : chaque enquête porte un `schemaVersion`, et tout changement de modèle s'accompagne d'une migration testée.
6. **Accessibilité et clavier** : toutes les actions principales sont utilisables au clavier.

---

## 2. Stack technique

| Domaine                 | Choix                                                             |
| ----------------------- | ----------------------------------------------------------------- |
| Build                   | Vite + React 19 + TypeScript (`strict: true`)                     |
| Gestionnaire de paquets | pnpm                                                              |
| UI                      | Tailwind CSS v4 + shadcn/ui + lucide-react                        |
| Graphe (rendu/édition)  | @xyflow/react (React Flow)                                        |
| Algorithmes de graphe   | graphology (+ graphology-shortest-path, graphology-metrics)       |
| Layouts automatiques    | elkjs (dans un Web Worker)                                        |
| État                    | Zustand + zundo (undo/redo)                                       |
| Persistance             | Dexie.js (IndexedDB)                                              |
| Validation              | Zod (source de vérité unique des schémas)                         |
| Markdown                | react-markdown + DOMPurify                                        |
| Carte                   | Leaflet + OpenStreetMap (opt-in)                                  |
| Crypto                  | WebCrypto (AES-GCM + PBKDF2)                                      |
| Tests                   | Vitest + Testing Library + fake-indexeddb ; Playwright pour l'E2E |
| Qualité                 | ESLint + Prettier + typecheck en CI                               |
| Distribution            | PWA (vite-plugin-pwa), déploiement GitHub Pages                   |

---

## 3. Arborescence cible

```
src/
  app/                # bootstrap, routing, layout global, providers
  features/
    investigations/   # liste, création, renommage, suppression d'enquêtes
    graph/            # canvas React Flow, nœuds, arêtes, toolbar, layouts
    entities/         # panneau de détail, formulaires, types d'entités
    relations/
    sources/          # sources, pièces jointes, confiance
    search/           # recherche, filtres, palette de commandes
    timeline/
    map/
    import-export/
    extraction/       # extraction d'entités depuis du texte brut
    pivots/
    crypto/
  domain/
    schemas.ts        # schémas Zod + types inférés
    entity-types.ts   # définition des types d'entités (icône, couleur, propriétés)
    migrations/       # migrations de schemaVersion
  db/
    dexie.ts          # définition de la base et des index
    repositories/     # accès aux données (aucun accès Dexie direct depuis les composants)
  store/              # stores Zustand
  lib/                # utilitaires purs (sanitize, hash, ids, regex…)
  workers/            # layout elkjs, calculs lourds
tests/
  e2e/                # Playwright
```

---

## 4. Modèle de données (v1)

```ts
// src/domain/schemas.ts — à implémenter avec Zod, types inférés via z.infer
Investigation { id: string; name: string; description?: string;
                createdAt: string; updatedAt: string;
                schemaVersion: number; encrypted: boolean }

Entity        { id: string; investigationId: string;
                type: EntityTypeId; label: string;
                properties: Record<string, unknown>;
                tags: string[]; notes?: string;          // Markdown
                sourceIds: string[]; confidence?: Confidence;
                status: "verified" | "hypothesis";
                position: { x: number; y: number };
                createdAt: string; updatedAt: string }

Relation      { id: string; investigationId: string;
                from: string; to: string;                // ids d'entités
                label: string; directed: boolean;
                sourceIds: string[]; confidence?: Confidence;
                status: "verified" | "hypothesis";
                createdAt: string; updatedAt: string }

Source        { id: string; investigationId: string;
                url?: string; title?: string;
                capturedAt: string; archiveUrl?: string;
                attachmentId?: string; sha256?: string; note?: string }

Attachment    { id: string; investigationId: string;
                blob: Blob; mime: string; size: number; sha256: string }

Confidence    { reliability: "A"|"B"|"C"|"D"|"E"|"F";   // code Amirauté : fiabilité de la source
                credibility: 1|2|3|4|5|6 }              // crédibilité de l'information
```

Types d'entités par défaut : `person`, `alias` (pseudo/compte), `email`, `phone`, `domain`, `ip`, `url`,
`organization`, `address`, `image`, `document`, `crypto_wallet`, `vehicle`, `event`.

IDs : `crypto.randomUUID()`. Dates : ISO 8601 UTC.

---

## 5. Definition of Done (pour chaque tâche)

- [ ] Code TypeScript strict, sans `any` non justifié
- [ ] Tests unitaires pour la logique métier (domain, repositories, lib)
- [ ] `pnpm lint`, `pnpm typecheck` et `pnpm test` passent
- [ ] Aucune nouvelle requête réseau au runtime (sauf opt-in documenté)
- [ ] Toute donnée affichée provenant de l'utilisateur ou d'un import est assainie
- [ ] UI fonctionnelle en thème clair et sombre
- [ ] Une case cochée dans ce fichier

---

## 6. Jalons

### v0.0 — Fondations

- [x] Initialiser le projet Vite + React + TS (strict) avec pnpm
- [x] Configurer Tailwind v4, shadcn/ui, thème clair/sombre (suivi du système + bascule manuelle)
- [x] Configurer ESLint, Prettier, Vitest, Playwright
- [x] Ajouter une CSP stricte via `<meta http-equiv="Content-Security-Policy">` (`default-src 'self'`, pas d'`unsafe-eval`)
- [x] CI GitHub Actions : lint, typecheck, tests, build
- [ ] Déploiement automatique sur GitHub Pages depuis `main`
- [ ] Fichiers repo : `LICENSE`, `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CLAUDE.md`

**Critère d'acceptation** : `pnpm dev` affiche une coquille d'app vide et la CI est verte.

### v0.1 — MVP : graphe éditable et persistant

- [ ] Schémas Zod du modèle (§4) + tests de validation
- [ ] Base Dexie (tables `investigations`, `entities`, `relations`, `sources`, `attachments`, index par `investigationId`)
- [ ] Repositories CRUD + tests avec fake-indexeddb
- [ ] Écran d'accueil : liste des enquêtes, créer, renommer, supprimer (avec confirmation)
- [ ] Canvas React Flow : zoom, pan, minimap, grille magnétique
- [ ] Nœud personnalisé par type d'entité (icône, couleur, label)
- [ ] Ajout d'entité (barre d'outils + double-clic sur le canvas)
- [ ] Création de relation par glisser d'un nœud à l'autre, avec saisie du label
- [ ] Panneau latéral de détail : édition du label, des propriétés, des tags et des notes Markdown (rendu assaini)
- [ ] Suppression d'entités/relations (touche Suppr), suppression en cascade des relations orphelines
- [ ] Sauvegarde automatique debouncée de toutes les modifications, y compris les positions
- [ ] Export / import JSON d'une enquête (format versionné, validé par Zod, rejet propre en cas d'erreur)

**Critère d'acceptation** : je crée une enquête, ajoute 10 entités reliées, recharge la page,
tout est intact ; j'exporte en JSON, supprime l'enquête, la réimporte à l'identique.

### v0.2 — Sources, confiance, navigation

- [ ] CRUD des sources, rattachement à une entité ou une relation
- [ ] Pièces jointes (captures d'écran) stockées en Blob + calcul SHA-256
- [ ] Champ « lien archive.org » et date de capture
- [ ] Niveau de confiance (code Amirauté) et statut vérifié/hypothèse
- [ ] Rendu visuel : relations hypothétiques en pointillés, badge de confiance sur les nœuds
- [ ] Recherche plein texte (labels, propriétés, notes) avec mise en évidence sur le graphe
- [ ] Filtres par type, tag, statut et confiance (les éléments filtrés sont estompés)
- [ ] Undo/redo (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z) via zundo
- [ ] Export PNG et SVG du graphe

### v0.3 — Analyse et productivité

- [ ] Layouts automatiques (force, hiérarchique, radial) via elkjs dans un Web Worker
- [ ] Plus court chemin entre deux entités sélectionnées (graphology), mis en évidence
- [ ] Mise en évidence des voisins à N sauts
- [ ] Fusion de deux entités (propriétés, tags, sources et relations fusionnés, sans perte)
- [ ] Extraction depuis du texte : coller un texte, détection par regex (emails, IP v4/v6, domaines, URLs, téléphones, wallets BTC/ETH), aperçu puis création sélective
- [ ] Pivots : templates d'URL par type d'entité (ex. `https://crt.sh/?q={value}`), ouverts dans un nouvel onglet avec `rel="noopener noreferrer"`, éditables dans les paramètres
- [ ] Palette de commandes (Cmd/Ctrl+K)
- [ ] Groupes / clusters visuels de nœuds

### v0.4 — Vues complémentaires

- [ ] Vue tableau de toutes les entités (tri, filtres, édition rapide)
- [ ] Timeline des entités et relations datées (type `event` et propriétés date)
- [ ] Carte Leaflet des entités géolocalisées. **Désactivée par défaut**, avec un avertissement expliquant que les tuiles sont chargées depuis un serveur tiers

### v1.0 — Sécurité, interopérabilité, distribution

- [ ] Chiffrement optionnel par enquête : AES-GCM, clé dérivée par PBKDF2 (≥ 600 000 itérations, sel aléatoire), déverrouillage par passphrase, clé gardée uniquement en mémoire
- [ ] Verrouillage automatique après inactivité
- [ ] Export chiffré (le JSON exporté reste chiffré)
- [ ] Export CSV (entités, relations) et GraphML (Gephi)
- [ ] Export STIX 2.1 (bundle) pour OpenCTI/MISP
- [ ] Rapport d'enquête Markdown et PDF (graphe, entités, sources)
- [ ] Types d'entités personnalisés (schéma de propriétés, icône, couleur)
- [ ] PWA installable et fonctionnement hors ligne complet
- [ ] Système de migrations de `schemaVersion` + tests de migration
- [ ] Tests E2E Playwright des parcours principaux
- [ ] Documentation utilisateur et captures pour le README

### Idées post-1.0 (non prioritaires)

- Internationalisation FR/EN
- Rendu Sigma.js pour les très gros graphes (> 5 000 nœuds)
- Import depuis Maltego (.mtgx) et OSINTracker
- Comparaison de deux enquêtes / détection d'entités communes
- Plugins de pivots communautaires

---

## 7. Notes pour l'agent de développement

- Traiter **une seule tâche à la fois**, dans l'ordre, puis cocher la case correspondante dans ce fichier.
- Avant d'ajouter une dépendance, vérifier qu'elle n'effectue aucun appel réseau au runtime et justifier son ajout.
- Les composants n'accèdent jamais directement à Dexie : ils passent par les repositories et les stores.
- La logique métier (domain, lib) reste pure et testable sans DOM.
- Ne jamais logguer le contenu des enquêtes dans la console en production.
- En cas d'ambiguïté sur un comportement produit, s'arrêter et demander plutôt que d'inventer.
