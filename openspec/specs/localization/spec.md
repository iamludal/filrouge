# localization Specification

## Purpose
Lets each user work with Filrouge in French or English: the interface language is detected from
the browser's preferences, can be changed at any time, and never alters investigation content.

## Requirements

### Requirement: Supported languages
The interface SHALL be available in French and English. Every user-facing text produced by the
application (labels, buttons, menus, dialogs, placeholders, tooltips, accessible names, toasts,
error and empty-state messages) SHALL be shown in the active language. Scenarios elsewhere in the
specs that quote interface texts describe the French interface.

#### Scenario: English interface
- **WHEN** the active language is English and the home screen is displayed
- **THEN** the button reads "New investigation" and no French interface text is shown

#### Scenario: French interface
- **WHEN** the active language is French and the home screen is displayed
- **THEN** the button reads "Nouvelle enquête"

### Requirement: Language detected from browser preferences
When no language was chosen in this browser, the active language SHALL be the first entry of the
browser's preferred languages whose primary subtag is `fr` or `en`, ignoring region and case.
When no entry matches, the active language SHALL be English.

#### Scenario: French browser
- **WHEN** no language was chosen and the browser's preferred languages are `fr-CA`, `en-US`
- **THEN** the interface is displayed in French

#### Scenario: English first
- **WHEN** no language was chosen and the browser's preferred languages are `en-GB`, `fr-FR`
- **THEN** the interface is displayed in English

#### Scenario: Unsupported language skipped
- **WHEN** no language was chosen and the browser's preferred languages are `de-DE`, `fr-FR`
- **THEN** the interface is displayed in French

#### Scenario: No supported language
- **WHEN** no language was chosen and the browser's only preferred language is `es-ES`
- **THEN** the interface is displayed in English

### Requirement: Language menu
The header SHALL show a language menu, next to the theme menu, offering "Français" and "English",
each written in its own language and with the active one marked. Its accessible name SHALL be in
the active language ("Changer de langue" / "Change language"). The menu SHALL be reachable on
narrow screens.

#### Scenario: Options of the menu
- **WHEN** the user opens the language menu while the interface is in English
- **THEN** it offers "Français" and "English", with "English" marked as selected

#### Scenario: Narrow screen
- **WHEN** the viewport is 360 px wide
- **THEN** the language menu is visible in the header and operable by touch

### Requirement: Switch language without reloading
Picking a language in the menu SHALL immediately re-render the whole interface in that language,
without reloading the page and without losing the open investigation, the selection, open panels,
unsaved form input or the undo history.

#### Scenario: Switch while editing
- **WHEN** an investigation is open with an entity selected, and the user picks "English"
- **THEN** the detail panel is shown in English with the same entity still selected, and "Undo" still reverts the last change

#### Scenario: Persisted data untouched
- **WHEN** the user switches language and then exports the investigation
- **THEN** the exported file is identical to an export made before the switch, except for the export timestamp

### Requirement: Language choice persists
A language picked in the menu SHALL be remembered in this browser and SHALL take precedence over
the browser's preferred languages on later visits. If browser storage is unavailable, the
application SHALL still work, using the detected language on each load.

#### Scenario: Reload after choosing
- **WHEN** the browser prefers French, the user picks "English" and reloads the page
- **THEN** the interface is displayed in English

#### Scenario: Storage unavailable
- **WHEN** browser storage throws on access and the browser prefers French
- **THEN** the interface is displayed in French and the language menu still switches the language for the session

### Requirement: Document language
The document's `lang` attribute SHALL be the active language code (`fr` or `en`) and SHALL follow
language switches.

#### Scenario: Switch to English
- **WHEN** the interface is in French and the user picks "English"
- **THEN** the document root's `lang` attribute is `en`

### Requirement: Locale-aware formatting
Dates, times, numbers and byte sizes SHALL be formatted with the conventions of the active
language, in the browser's time zone. Byte units SHALL be "o", "Ko", "Mo" in French and "B",
"KB", "MB" in English. Lists of user tags SHALL be sorted with the active language's collation.

#### Scenario: Date in English
- **WHEN** the interface is in English and an entity created on 20 October 2026 is selected
- **THEN** its creation date reads "Oct 20, 2026"

#### Scenario: Size in English
- **WHEN** the interface is in English and a screenshot of 8.4 MiB is attached
- **THEN** its size reads "8.4 MB"

#### Scenario: Size in French
- **WHEN** the interface is in French and a screenshot of 8.4 MiB is attached
- **THEN** its size reads "8,4 Mo"

### Requirement: Investigation content is never translated
Content stored in an investigation (names, labels, property keys and values, tags, notes,
relation labels, source titles) SHALL be shown exactly as stored, whatever the active language.
Suggestions offered for property names and relation labels SHALL be in the active language, and a
picked suggestion SHALL be stored as the text shown at the time it was picked.

#### Scenario: Relation label kept
- **WHEN** a relation labelled "connaît" exists and the user switches to English
- **THEN** its link still reads "connaît"

#### Scenario: English suggestions
- **WHEN** the interface is in English and the user edits a relation label
- **THEN** the suggestions include "knows" and "works for"

#### Scenario: Picked suggestion stored as shown
- **WHEN** the interface is in English, the user picks the suggested property "first name" on a person, then switches to French
- **THEN** the property key still reads "first name"

### Requirement: Import errors in the active language
Messages explaining why an imported file is rejected SHALL be in the active language, including
messages describing schema validation failures.

#### Scenario: Invalid JSON in English
- **WHEN** the interface is in English and the user imports a file that is not valid JSON
- **THEN** the import is rejected with "The file is not valid JSON"

#### Scenario: Invalid JSON in French
- **WHEN** the interface is in French and the user imports a file that is not valid JSON
- **THEN** the import is rejected with "Le fichier n'est pas un JSON valide"
