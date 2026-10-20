# Proposal

## Why

Every user-facing string in filrouge is hard-coded in French, and dates, numbers and sizes are
formatted with `fr-FR`. OSINT is an international practice: an English interface makes the tool
usable by non-French speakers and is a prerequisite for outside contributions. Internationalisation
is listed in the roadmap's post-1.0 ideas; it is pulled forward now, while the string surface is
still small (~45 files), before more features multiply it.

## What Changes

- The interface is available in two languages: French and English.
- On first visit, the language is detected from the browser's preferred languages
  (`navigator.languages`, which reflects the operating system's language by default): the first
  entry whose primary subtag is `fr` or `en` wins; when none matches, English is used.
- A language menu in the header, next to the theme menu, lets the user switch between "Français"
  and "English" at any time, without reloading and without losing unsaved state. The choice
  persists in this browser and then takes precedence over detection.
- The document's `lang` attribute follows the active language.
- Dates, numbers and byte sizes (`Ko`/`Mo` vs `KB`/`MB`) are formatted for the active language;
  tag sorting uses the active language's collation.
- Built-in vocabularies are translated: entity type labels, suggested property names, relation
  label suggestions, Admiralty scale meanings, source fallbacks ("Source sans titre"), import
  validation messages (including Zod's built-in messages) and toasts.
- English wording follows established OSINT and intelligence vocabulary rather than literal
  translation: the Admiralty scale uses the NATO AJP-2.1 labels (as reproduced in the MISP
  `admiralty-scale` taxonomy), and a "cotation" is a "rating" ("Rating: B2").
- Investigation content is never translated: labels, property keys, tags, notes and relation
  labels the user typed or picked from a suggestion stay exactly as stored. The JSON export
  format is unchanged and language-neutral; no data model change, no `SCHEMA_VERSION` bump.
- The exported image (SVG/PNG) contains investigation content only, so it is unaffected.
- Existing specs keep quoting French strings: those scenarios describe the French interface.

## Capabilities

### New Capabilities

- `localization`: interface language (French, English), detection from browser/OS preferences,
  language menu, persistence of the choice, `lang` attribute, locale-aware formatting, and the
  rule that investigation content is never translated.

### Modified Capabilities

- `entities`: entity type labels are in the active language instead of French only.
- `assessment`: Admiralty scale meanings are given in the active language (French values kept as
  the reference scenarios, NATO English labels added), plus the English assessment vocabulary
  ("Source reliability", "Information credibility", "Not rated", "Rating", "Hypothesis").
- `graph-canvas`: the grade tooltip shows the grade meaning in the active language.
- `element-timestamps`: detail-panel dates use the active language's medium format instead of the
  French one.

## Impact

- New module `src/i18n/` (dictionaries, provider, hooks); every component with a hard-coded
  string in `src/features/`, `src/components/` and `src/app/`.
- `src/domain/` (entity types, relations, assessment, sources, export-format): user-facing texts
  move out of the domain, which returns ids or error codes that the UI translates; the domain
  stays DOM-free.
- `src/lib/format.ts`: formatters take the locale.
- `index.html` (`lang`), header (`src/app/app.tsx`), a new language menu component, also listed
  in the compact header if the header collapses on narrow screens.
- Tests: Vitest and Playwright default to French so existing assertions keep working; new tests
  cover detection, switching and English rendering.
- No new runtime dependency (typed in-house dictionaries; Zod locales ship with `zod`), no network,
  CSP unchanged.
- `ROADMAP.md`: the "Internationalisation FR/EN" idea moves into v0.3 as a task.
