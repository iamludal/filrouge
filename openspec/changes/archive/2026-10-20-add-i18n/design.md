# Design

## Context

See proposal.md for motivation. Current state:

- ~45 source files hold French literals: components in `src/features/`, `src/components/`,
  `src/app/`, and user-facing texts inside the domain (`entity-types.ts` labels and property
  suggestions, `relations.ts` suggestions, `assessment.ts` labels and phrases, `sources.ts`
  validation messages and fallbacks, `export-format.ts` import errors).
- `src/lib/format.ts` and a few call sites hard-code `fr-FR`; `graph-view.ts` sorts tags with
  `localeCompare(…, 'fr')`.
- Zod runs with its default (English) messages, so import errors currently mix French paths with
  English Zod messages.
- Repositories and the store throw internal `Error`s with French messages (`Enquête introuvable`,
  `Source encore utilisée`…). They signal programming or integrity errors, not user input.
- The theme preference (`src/app/theme.tsx`) is the model to follow: a context provider, a
  `localStorage` key `filrouge:*` read inside `try/catch`, a header dropdown menu.
- Unit tests (jsdom, `navigator.language` = `en-US`) and e2e tests (Playwright default locale
  `en-US`) assert on French texts.

## Goals / Non-Goals

**Goals:**

- Type-safe translations: a missing key or a missing English entry fails `typecheck`.
- Domain stays pure and DOM-free; no React or locale state imported into `src/domain/`.
- Switching language is a pure re-render: no reload, no store reset.
- Zero runtime dependency added, no network, CSP unchanged.

**Non-Goals:**

- More than two languages, right-to-left support, translated URLs/routes.
- Translating investigation content or the bundled demo investigation (`docs/examples/`).
- Translating internal thrown errors of repositories/store, developer docs, ROADMAP or CLAUDE.md.
- An "automatic" option in the language menu: detection applies only while no choice is stored.

## Decisions

### D1 — In-house typed dictionaries instead of i18next / FormatJS

`src/i18n/messages/fr.ts` is the source of truth (`as const` object, nested by feature:
`common`, `home`, `graph`, `detail`, `sources`, `assessment`, `entityTypes`, `importExport`…).
`en.ts` is typed `Messages` (derived from `fr`'s shape with string leaves), so TypeScript flags
any missing or extra key. Values are plain strings or functions for interpolation and plurals:
`deleteCount: (n: number) => n > 1 ? \`Supprimer ${n} éléments\` : 'Supprimer l'élément'`.

- *Alternatives*: i18next + react-i18next (≈ 40 KB, string keys checked only with extra
  codegen, ICU plugin for plurals); FormatJS/react-intl (heavier, ICU message syntax parsed at
  runtime). Two languages and a few hundred strings do not justify either; functions give
  interpolation and plurals with full type checking and no parser.
- Both dictionaries are bundled statically (a few KB gzipped each). Lazy-loading the inactive one
  would add an async gap on switch for a negligible gain.

### D2 — `LocaleProvider` + `useI18n()` mirroring the theme

`src/i18n/locale.tsx` exposes `LocaleProvider`, `useI18n(): { locale, t, setLocale }`, where `t`
is the active dictionary object (`t.home.newInvestigation`, `t.graph.deleteCount(3)`).
`LocaleProvider` wraps the app in `src/app/providers.tsx`; context change re-renders consumers
only — Zustand stores, React Flow state, undo history and form state are untouched.

- Pure helpers in `src/i18n/detect.ts` (unit-tested without React):
  `resolveLocale(stored: unknown, languages: readonly string[]): Locale` — stored `fr`/`en` wins,
  else first `languages` entry whose lowercased primary subtag is `fr` or `en`, else `en`.
- The context defaults to French, so a component rendered without provider (existing tests) works
  and needs no wrapper; the real app always mounts `LocaleProvider`.
- Storage key `filrouge:locale`, read and written in `try/catch` like the theme.
- `document.documentElement.lang` is set synchronously in `main.tsx` from the resolved locale
  before `createRoot().render`, then kept in sync by the provider. `index.html` keeps `lang="fr"`
  as a static default; no pre-paint script is needed since all texts are rendered by React.
- The `languagechange` event is not listened to: the browser preference is read at load only.

### D3 — Domain returns identifiers, the UI translates

The domain keeps its ids and data, and loses its display texts:

- `ENTITY_TYPES[id]` keeps `icon`, `color`; `label` and `properties` move to
  `t.entityTypes[id].label` / `.properties`. A helper `entityTypeLabel(t, id)` avoids repetition.
- `RELATION_SUGGESTIONS` moves to `t.relations.suggestions`.
- `assessment.ts` keeps the scale values and grade logic; labels and phrases come from
  `t.assessment.reliability[value]` / `.credibility[value]`, and `gradeDescription` takes them as
  a parameter (or moves to `src/i18n/`).
- `sources.ts` validation returns codes (`'url' | 'date' | 'empty'`) and `sourceDisplayName`
  returns `undefined` for an untitled source; the UI renders `t.sources.untitled`.
- `export-format.ts` returns structured errors
  `{ code: 'tooLarge' | 'invalidJson' | 'newerVersion' | 'schema' | 'attachment' | …, path?, params? }`;
  `src/features/import-export/` formats them with `t.importExport.errors`.

*Alternative*: pass `t` into domain functions everywhere. Rejected: couples the domain to UI
wording and makes domain tests depend on dictionaries.

### D4 — Zod messages follow the locale via `z.config(z.locales.xx())`

`schemas.ts` already calls `z.config({ jitless: true })`. On locale change the provider calls
`z.config(locale === 'fr' ? z.locales.fr() : z.locales.en())` (the locale bundles ship inside
`zod`, no network). Custom `superRefine` messages in `export-format.ts` become codes (D3) so
they are translated by the UI rather than by Zod. `z.config` merges, so `jitless` is preserved;
a unit test asserts it.

### D5 — Formatting with a locale-aware formatter set

`src/lib/format.ts` exports `createFormatters(locale)` returning `formatDate`,
`formatDateTime`, `formatDateTimeFull`, `formatBytes`, `formatNumber`, with `Intl.DateTimeFormat`
/ `NumberFormat` instances cached per locale. Locale tags: `fr-FR` and `en-US`
(`"Oct 20, 2026"`). `useI18n()` exposes them as `format`. Byte units come from the
dictionary (`o/Ko/Mo`, `B/KB/MB`), still on binary (1024) steps as today. Tag sorting
(`graph-view.ts`) takes the collation locale as an argument.

### D6 — Tests default to French; English covered explicitly

- Vitest: `src/test/setup.ts` stores `filrouge:locale = fr` before each test (and after
  `localStorage.clear()` if any test clears it), so existing assertions stay valid. A
  `renderWithLocale(ui, 'en')` helper covers English cases.
- Playwright: `use: { locale: 'fr-FR' }` in `playwright.config.ts` for both projects, so existing
  specs keep working. A new `i18n.spec.ts` uses `test.use({ locale: 'en-US' })` and
  `locale: 'de-DE'` to check detection, switching, persistence after reload, and `lang`.
- A unit test walks `fr` and `en` and asserts the same key set and no empty string (TypeScript
  already enforces shape; this catches `''` placeholders).

### D7 — Migration of strings, feature by feature

Two commits. First, a behavior-neutral refactor: the dictionary shape, `useI18n()` pinned to
French, and every literal extracted one feature folder at a time, each step leaving the app fully
French and green (existing tests are the safety net). Second, the feature: `en.ts`, detection,
persistence, menu, `lang`, Zod locales and English tests. Typing `en` against `fr` makes the
second commit's dictionary complete by construction. ESLint cannot easily forbid JSX literals without
false positives (icons, symbols, `·`), so no lint rule is added; the e2e English walk-through and
a grep for accented characters in `src/` (outside `src/i18n/` and tests) serve as the final check.

### D8 — English OSINT vocabulary

English texts use the terms practitioners and tools already use, not literal translations.
Reference glossary for `en.ts`:

| French                                                | English                                                                                                                | Reference                            |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Enquête                                               | Investigation                                                                                                          | Maltego, Flowsint                    |
| Entité / Relation                                     | Entity / Relation (link on the graph)                                                                                  | Maltego "entity", link analysis      |
| Capture                                               | Screenshot                                                                                                             | —                                    |
| Empreinte (SHA-256)                                   | Hash (SHA-256)                                                                                                         | forensics usage                      |
| Cotation                                              | Rating ("Rating: B2", "rated B2")                                                                                      | Admiralty code literature            |
| Fiabilité de la source / Crédibilité de l'information | Source reliability / Information credibility                                                                           | NATO AJP-2.1                         |
| A … F                                                 | Completely reliable, Usually reliable, Fairly reliable, Not usually reliable, Unreliable, Reliability cannot be judged | NATO AJP-2.1, MISP `admiralty-scale` |
| 1 … 6                                                 | Confirmed by other sources, Probably true, Possibly true, Doubtful, Improbable, Truth cannot be judged                 | NATO AJP-2.1, MISP `admiralty-scale` |
| Non évaluée                                           | Not rated                                                                                                              | —                                    |
| Hypothèse / vérifiée                                  | Hypothesis / verified                                                                                                  | —                                    |
| Alias / compte                                        | Alias / account                                                                                                        | Maltego "Alias"                      |
| Adresse IP                                            | IP address                                                                                                             | Maltego "IPv4 Address"               |
| Portefeuille crypto                                   | Crypto wallet                                                                                                          | Flowsint                             |
| Pivot                                                 | Pivot                                                                                                                  | OSINT usage                          |
| résout vers / enregistré par / héberge                | resolves to / registered by / hosts                                                                                    | DNS and WHOIS usage                  |

Sources: [Admiralty code (Wikipedia)](https://en.wikipedia.org/wiki/Admiralty_code), [MISP
admiralty-scale taxonomy](https://github.com/MISP/misp-taxonomies/tree/main/admiralty-scale),
[Maltego standard entities](https://docs.maltego.com/support/solutions/articles/15000034102-standard-entities),
[Flowsint](https://github.com/SocialMDev/flowsint).

### D9 — Language menu

`src/components/language-menu.tsx`, a `DropdownMenu` with `DropdownMenuRadioGroup` like
`ThemeToggle`, trigger icon `Languages` (lucide), placed before `ThemeToggle` in the header.
Option labels are endonyms ("Français", "English") and carry `lang` attributes so screen readers
pronounce them correctly. The header is already shown on narrow screens; nothing to add to
`compact-graph-toolbar.tsx` (it is not a graph-toolbar action).

## Risks / Trade-offs

- [Missed literal shows French in English UI] → final grep for accented characters and French
  stop-words outside `src/i18n/`, plus the English e2e walk-through of the main flows.
- [Large diff touching many tests] → tests keep French as default (D6), so most test files are
  untouched; only domain tests that asserted French texts change to codes/ids.
- [Text length differences break narrow layouts] → mobile e2e runs in both languages for the
  toolbar and drawer; English is generally shorter than French.
- [Stored property keys and relation labels end up mixed-language across users] → accepted and
  specified: content is the user's, shown as stored.
- [`z.config` is global] → only one locale is active at a time; switching updates it before the
  next validation.

## Migration Plan

No data migration: nothing persisted changes except the new `filrouge:locale` key. Existing users
with a French browser see no change; users with a non-French browser get English on next load and
can switch back from the menu. Rollback is a plain revert.
