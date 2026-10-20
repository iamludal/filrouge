# element-timestamps Specification

## Purpose
Tells the user when each entity and relation was recorded and when its content last changed, and
fixes which edits count as a change, so the dates can be trusted to retrace an investigation.

## Requirements

### Requirement: Creation date
Every entity and every relation SHALL have a creation date, set to the instant it is created and
never changed afterwards by any edit.

#### Scenario: New entity
- **WHEN** the user adds an entity, then exports the investigation
- **THEN** the entity's `createdAt` and `updatedAt` are equal and match the instant of creation

#### Scenario: Creation date survives edits
- **WHEN** the user renames an existing entity
- **THEN** its `createdAt` is unchanged

### Requirement: Content edits refresh the last-modified date
The last-modified date of an entity or relation SHALL be set to the current instant whenever its
own content changes: type, label, properties, tags, notes, status, confidence, a relation's label
or direction, its list of sources (attach, detach, or deletion of a cited source), or an entity's
tool checks (checking or unchecking a tool).

#### Scenario: Edit a property
- **WHEN** the user changes a property value of the selected entity
- **THEN** its `updatedAt` becomes the instant of the edit

#### Scenario: Attach a source to a relation
- **WHEN** the user attaches an existing source to a relation
- **THEN** the relation's `updatedAt` becomes the instant of the attachment

#### Scenario: Delete a cited source
- **WHEN** the user deletes a source cited by an entity
- **THEN** that entity's `updatedAt` becomes the instant of the deletion

#### Scenario: Check a tool
- **WHEN** the user checks a tool in the selected entity's "Outils" tab
- **THEN** the entity's `updatedAt` becomes the instant of the check, equal to the check's `checkedAt`

### Requirement: Edits that leave the last-modified date alone
Moving entities on the canvas, editing the fields or screenshot of a source, and adding or
removing a relation SHALL NOT change the last-modified date of any entity.

#### Scenario: Move a node
- **WHEN** the user drags an entity to another position
- **THEN** its position is saved and its `updatedAt` is unchanged

#### Scenario: Edit a cited source
- **WHEN** the user changes the title of a source cited by an entity
- **THEN** the entity's `updatedAt` is unchanged

#### Scenario: Connect two entities
- **WHEN** the user creates a relation between two entities
- **THEN** neither entity's `updatedAt` changes

### Requirement: Undo and redo restore dates
Undoing or redoing an edit SHALL restore the creation and last-modified dates of the affected
elements as they were in the restored state, rather than setting them to the current instant.

#### Scenario: Undo a rename
- **WHEN** the user renames an entity, then undoes
- **THEN** the entity's label and `updatedAt` are back to their values before the rename

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

### Requirement: Date labels on demand
Each displayed date SHALL have the accessible name "Créée le <date>" or "Modifiée le <date>",
SHALL expose its instant as a machine-readable ISO 8601 value, and SHALL show a tooltip on hover
or keyboard focus with the label and the full date and time, seconds included.

#### Scenario: Hover a date
- **WHEN** the user hovers the creation date
- **THEN** a tooltip shows "Créée le" followed by the full date and time with seconds (e.g. "Créée le 20 octobre 2026 à 14:32:05")

#### Scenario: Keyboard focus
- **WHEN** the user tabs to the modification date
- **THEN** the same tooltip opens with "Modifiée le" and the full date and time

#### Scenario: Screen reader
- **WHEN** an assistive technology reads the panel
- **THEN** each date is announced with its "Créée le" or "Modifiée le" label

### Requirement: Dates on narrow screens
On narrow screens, the expanded detail drawer SHALL show the same dates as the side panel. The
collapsed drawer summary SHALL NOT show them.

#### Scenario: Mobile viewport
- **WHEN** on a 360 px wide screen the user selects an entity and expands the drawer
- **THEN** the drawer shows the creation icon and date, with the accessible name "Créée le <date>"

### Requirement: Dates kept on import
Importing an investigation SHALL keep the creation and last-modified dates of every entity and
relation from the file, including when the import creates a copy with new ids.

#### Scenario: Import as a copy
- **WHEN** the user imports twice the same file
- **THEN** the entities and relations of the copy have the same `createdAt` and `updatedAt` as in the file

### Requirement: Date labels in English
In English, each displayed date SHALL have the accessible name "Created on <date>" or "Modified
on <date>", and its tooltip SHALL show that label followed by the full date and time, seconds
included.

#### Scenario: Hover a date in English
- **WHEN** the interface is in English and the user hovers the creation date
- **THEN** a tooltip shows "Created on" followed by the full date and time with seconds (e.g. "Created on October 20, 2026 at 2:32:05 PM")
