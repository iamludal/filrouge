# Spec Delta

## MODIFIED Requirements

### Requirement: Dates shown in the detail panel
The detail panel of a single selected entity or relation SHALL start, above its other fields,
with its creation date and, when it differs, its last-modified date. Each date SHALL be shown as
a distinct icon (creation, modification) followed by the day in the active language's medium
format, in the browser's time zone (e.g. "20 oct. 2026" in French, "Oct 20, 2026" in English),
with no visible text label. The two dates SHALL sit side by side on one row when they fit, and
wrap onto a second row on a very narrow panel.

#### Scenario: Freshly created entity
- **WHEN** the user adds an entity and looks at its panel
- **THEN** the panel shows the creation icon and date, and no modification date

#### Scenario: Edited relation
- **WHEN** the user changes the label of a relation created earlier
- **THEN** its panel shows both dates, the modification one with the instant of the edit

#### Scenario: Live update
- **WHEN** the user edits the selected entity's notes
- **THEN** the modification date appears or updates without reselecting the entity

#### Scenario: Dates follow the language
- **WHEN** an entity created on 20 October 2026 is selected and the user switches from French to English
- **THEN** its creation date changes from "20 oct. 2026" to "Oct 20, 2026" without reselecting the entity

## ADDED Requirements

### Requirement: Date labels in English
In English, each displayed date SHALL have the accessible name "Created on <date>" or "Modified
on <date>", and its tooltip SHALL show that label followed by the full date and time, seconds
included.

#### Scenario: Hover a date in English
- **WHEN** the interface is in English and the user hovers the creation date
- **THEN** a tooltip shows "Created on" followed by the full date and time with seconds (e.g. "Created on October 20, 2026 at 2:32:05 PM")
