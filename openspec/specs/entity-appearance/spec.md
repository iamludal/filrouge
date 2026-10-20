# entity-appearance Specification

## Purpose

Lets the investigator set an entity apart from the others of its type: a custom colour and icon
that replace the type's, and an "important" marker, edited in the detail panel and kept with the
investigation.

## Requirements

### Requirement: Colour palette
The application SHALL offer a fixed palette of 16 colours, each with a stable id and a name in the
active language: red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo,
violet, purple, pink and slate. Every entity type's colour SHALL be one of them. No other colour
SHALL be selectable.

#### Scenario: Palette offered
- **WHEN** the user opens the colour picker of the selected entity
- **THEN** 16 colour swatches are offered, each named (e.g. "Rouge", "Ardoise"), plus a "Couleur du type" choice

#### Scenario: Palette names in English
- **WHEN** the interface is in English and the user opens the colour picker
- **THEN** the swatches are named in English (e.g. "Red", "Slate") and the reset choice reads "Type color"

### Requirement: Custom colour
The user SHALL be able to give the selected entity one palette colour, which then replaces its
type's colour wherever the entity is drawn. Choosing "Couleur du type" SHALL remove the custom
colour. A custom colour SHALL be kept when the entity's type changes, even when it equals the type's
colour.

#### Scenario: Pick a colour
- **WHEN** the user picks "Rouge" for a "Personne" entity
- **THEN** its node circle and icon are drawn in red instead of the Personne blue

#### Scenario: Back to the type colour
- **WHEN** an entity has the custom colour "Rouge" and the user picks "Couleur du type"
- **THEN** its node uses its type's colour again and the exported entity has no `color` field

#### Scenario: Type change keeps the colour
- **WHEN** a "Personne" entity has the custom colour "Rouge" and the user changes its type to "Email"
- **THEN** its node is still red

#### Scenario: Current choice shown
- **WHEN** an entity has the custom colour "Vert" and the user opens the colour picker
- **THEN** the "Vert" swatch is shown as selected, and when it has no custom colour "Couleur du type" is

### Requirement: Icon set
The application SHALL offer a fixed set of 95 icons, each with a stable id and a name in the
active language: the 14 entity type icons plus 81 others (e.g. a group of people, a mask, a skull,
an identity card, a factory, a truck, a drone, a satellite, a bitcoin, a lock, a bank, a gavel). Every icon SHALL be shipped
with the application. No other icon, and no user image, SHALL be selectable.

#### Scenario: Icon set offered
- **WHEN** the user opens the icon picker of the selected entity
- **THEN** 95 icons are offered, each with an accessible name (e.g. "Crâne"), plus an "Icône du type" choice

#### Scenario: No network request
- **WHEN** the user opens the icon picker and picks an icon
- **THEN** the application makes no network request

### Requirement: Custom icon
The user SHALL be able to give the selected entity one icon of the set, which then replaces its
type's icon wherever the entity is drawn. Choosing "Icône du type" SHALL remove the custom icon. A
custom icon SHALL be kept when the entity's type changes.

#### Scenario: Pick an icon
- **WHEN** the user picks "Crâne" for a "Personne" entity
- **THEN** its node shows the skull icon instead of the person icon

#### Scenario: Back to the type icon
- **WHEN** an entity has a custom icon and the user picks "Icône du type"
- **THEN** its node shows its type's icon again and the exported entity has no `icon` field

#### Scenario: Type change keeps the icon
- **WHEN** a "Personne" entity has the icon "Crâne" and the user changes its type to "Alias / compte"
- **THEN** its node still shows the skull icon

### Requirement: Important marker
The user SHALL be able to mark the selected entity as important, and to remove the mark, with an
"Important" toggle in the detail panel showing whether the entity is marked. A new entity SHALL
not be important.

#### Scenario: Mark as important
- **WHEN** the user switches on "Important" for the selected entity
- **THEN** the toggle shows as on and the exported entity has `important` set to true

#### Scenario: Remove the mark
- **WHEN** an important entity's "Important" toggle is switched off
- **THEN** the exported entity has no `important` field

#### Scenario: New entity
- **WHEN** the user adds an entity
- **THEN** its "Important" toggle is off and it has no custom colour nor icon

### Requirement: Appearance controls in the detail panel
The detail panel of a single selected entity SHALL show an "Apparence" field with a "Couleur"
button, an "Icône" button, each showing the current choice and opening its picker, and the
"Important" toggle. They SHALL be keyboard operable and, on touch screens, offer targets of at
least 44 px. A multiple selection SHALL offer no appearance control.

#### Scenario: Keyboard choice
- **WHEN** the user focuses "Couleur", presses Enter, moves to "Orange" with the arrow keys and presses Enter
- **THEN** the entity's colour becomes orange and the picker closes

#### Scenario: Picker on a phone
- **WHEN** an entity is selected in a 412 px wide viewport and the user opens the icon picker from the expanded drawer
- **THEN** the picker fits in the screen without horizontal scrolling and every icon is at least 44 px wide

#### Scenario: Multiple selection
- **WHEN** two entities are selected
- **THEN** the detail panel shows no "Apparence" field

### Requirement: Entity colour and icon in the detail panel
The detail panel heading of a selected entity and the collapsed drawer summary (see
responsive-layout) SHALL show the entity's own icon and colour, next to its type's label.

#### Scenario: Heading of a styled entity
- **WHEN** a "Personne" entity with the icon "Crâne" and the colour "Rouge" is selected
- **THEN** the panel heading reads "Personne" in red with the skull icon

### Requirement: Appearance stored and exported
An entity's custom colour, custom icon and important mark SHALL be saved with the investigation,
included in the JSON export as the `color` (palette id), `icon` (icon id) and `important` fields,
and absent from the entity when not set. An import holding an unknown colour or icon id, or a
non-boolean `important`, SHALL be rejected. Files without these fields SHALL stay valid.

#### Scenario: Round trip
- **WHEN** an entity has the colour "Rouge", the icon "Crâne" and is important, and the user exports then imports the investigation as a copy
- **THEN** the copy's entity has `color` "red", `icon` "skull" and `important` true, and is drawn the same

#### Scenario: Survives a reload
- **WHEN** the user picks the colour "Rouge" for an entity and reloads the page once the save completes
- **THEN** the entity is still drawn in red

#### Scenario: Unknown colour rejected
- **WHEN** an imported entity has `color` "#ff0000"
- **THEN** the import is rejected with a validation error naming the entity's `color` field

#### Scenario: Unknown icon rejected
- **WHEN** an imported entity has `icon` "flag"
- **THEN** the import is rejected with a validation error naming the entity's `icon` field

#### Scenario: Older file
- **WHEN** an investigation exported before this change, whose entities have no `color`, `icon` nor `important`, is imported
- **THEN** the import succeeds and every entity uses its type's colour and icon, unmarked

### Requirement: Appearance edits are undoable
Changing an entity's colour, icon or important mark SHALL be an undoable edit (see edit-history).

#### Scenario: Undo a colour change
- **WHEN** the user picks "Rouge" for an entity drawn in its type's colour and presses Cmd/Ctrl+Z on the canvas
- **THEN** the entity is drawn in its type's colour again

#### Scenario: Undo the mark
- **WHEN** the user marks an entity as important and undoes
- **THEN** the entity is no longer important and its node shows no flag
