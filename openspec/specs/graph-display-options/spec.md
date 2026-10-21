# graph-display-options Specification

## Purpose

Lets the user declutter the graph view by hiding entity labels, relation labels, ratings, the
important mark or the mini-map, as a preference kept on the device for every investigation.

## Requirements

### Requirement: Display menu
The graph view toolbar SHALL show an "Affichage" button, after "Filtres", opening a menu of four
checkable options, each with an icon: "Libellés des entités", "Libellés des relations",
"Cotations" and "Marque « Important »", followed by a "Réinitialiser l'affichage" item. Every
option SHALL be checked by default. Choosing an option SHALL toggle it and apply at once, keeping
the menu open. The mini-map is not part of this menu (see "Mini-map button in the zoom controls").

#### Scenario: Open the menu
- **WHEN** the user clicks "Affichage" for the first time on a device
- **THEN** a menu lists "Libellés des entités", "Libellés des relations", "Cotations" and "Marque « Important »", all checked and each with an icon, then "Réinitialiser l'affichage"

#### Scenario: Toggle an option
- **WHEN** the user opens "Affichage" and chooses "Libellés des entités"
- **THEN** the option is unchecked, the entity labels disappear from the canvas and the menu stays open

#### Scenario: Menu in English
- **WHEN** the interface is in English and the user opens "Display"
- **THEN** the menu lists "Entity labels", "Relation labels", "Ratings" and "Important mark", then "Reset display"

### Requirement: Hide entity labels
While "Libellés des entités" is unchecked, no entity node SHALL show its label under its circle.
Hovering the node SHALL still show the entity's name, and the node SHALL keep it as its accessible
name.

#### Scenario: Labels hidden
- **WHEN** entity "Jean Dupont" is on the canvas and the user unchecks "Libellés des entités"
- **THEN** the text "Jean Dupont" is no longer shown under its circle

#### Scenario: Name on hover
- **WHEN** "Libellés des entités" is unchecked and the user hovers the node of "Jean Dupont"
- **THEN** the name "Jean Dupont" is shown

#### Scenario: Search still works
- **WHEN** "Libellés des entités" is unchecked and the user searches "Dupont"
- **THEN** the node of "Jean Dupont" is highlighted

### Requirement: Hide relation labels
While "Libellés des relations" is unchecked, no link SHALL show a label, rating included, whatever
the state of "Cotations".

#### Scenario: Relation labels hidden
- **WHEN** a relation labelled "connaît" is graded "C3" and the user unchecks "Libellés des relations"
- **THEN** its link shows neither "connaît" nor "C3"

### Requirement: Hide ratings
While "Cotations" is unchecked, no entity node SHALL show a rating badge, and a relation's link
label SHALL show its label without its rating; a link whose label is empty SHALL show no label.

#### Scenario: Entity badge hidden
- **WHEN** an entity is graded "B2" and the user unchecks "Cotations"
- **THEN** its node shows no "B2" badge

#### Scenario: Relation label without rating
- **WHEN** a relation labelled "connaît" is graded "C3" and the user unchecks "Cotations"
- **THEN** its link label reads "connaît"

#### Scenario: Rating-only relation label
- **WHEN** a relation with an empty label is graded "A1" and the user unchecks "Cotations"
- **THEN** its link shows no label

### Requirement: Hide the important mark
While "Marque « Important »" is unchecked, an important entity's node SHALL be drawn like an
unmarked one: no flag badge, a 2 px border and the plain background. The "Importance" filter
criterion SHALL keep working on the entities marked important.

#### Scenario: Mark hidden
- **WHEN** an entity is marked important and the user unchecks "Marque « Important »"
- **THEN** its node shows no flag badge, a 2 px border and the plain card background

#### Scenario: Filter unaffected
- **WHEN** "Marque « Important »" is unchecked, entity A is important, entity B is not, and the user checks "Entités importantes uniquement" in the filters
- **THEN** B is dimmed and A is not

### Requirement: Mini-map button in the zoom controls
On wide screens, the zoom controls SHALL end with a map-icon button that hides or shows the
mini-map, named "Masquer la mini-carte" while the mini-map is shown and "Afficher la mini-carte"
while it is hidden, and drawn highlighted while the mini-map is shown. It SHALL stay at the same
place in both states, and the zoom controls SHALL stay shown while the mini-map is hidden. The
mini-map is shown by default. On narrow screens the button SHALL NOT be shown.

#### Scenario: Hide from the controls
- **WHEN** an investigation is opened in a 1280 px wide viewport and the user clicks "Masquer la mini-carte"
- **THEN** the mini-map is hidden, the button is named "Afficher la mini-carte" and the zoom controls are still shown

#### Scenario: Show from the controls
- **WHEN** the mini-map is hidden and the user clicks "Afficher la mini-carte"
- **THEN** the mini-map is shown and the button is named "Masquer la mini-carte"

#### Scenario: Apart from the display menu
- **WHEN** the mini-map is hidden and the user opens "Affichage"
- **THEN** the menu holds no mini-map item and the "Affichage" button shows no dot

#### Scenario: Button in English
- **WHEN** the interface is in English and the mini-map is shown
- **THEN** the button is named "Hide minimap"

#### Scenario: No button on a narrow screen
- **WHEN** an investigation is opened in a 412 px wide viewport
- **THEN** the zoom controls hold no "Masquer la mini-carte" nor "Afficher la mini-carte" button

### Requirement: Display is not investigation data
The display options SHALL only change how the graph is shown: they SHALL NOT modify any entity or
relation, SHALL NOT be saved in an investigation nor written to its JSON export, SHALL NOT change
its last modification date and SHALL NOT be recorded in the undo history.

#### Scenario: JSON export unchanged
- **WHEN** the user unchecks "Libellés des entités" and exports the investigation as JSON
- **THEN** the file is identical to the one exported with every option checked, entity labels included

#### Scenario: Not undoable
- **WHEN** the user renames an entity, unchecks "Cotations", then clicks "Annuler"
- **THEN** the rename is undone and "Cotations" stays unchecked

### Requirement: Display options kept on the device
The display options and the mini-map choice SHALL be kept across reloads on the device, and SHALL apply to every
investigation opened on it. Missing or unreadable stored options SHALL fall back to the defaults
without an error.

#### Scenario: Kept after reload
- **WHEN** the user unchecks "Cotations" and reloads the page
- **THEN** "Cotations" is still unchecked and no rating badge is shown

#### Scenario: Shared by investigations
- **WHEN** the user hides the mini-map in investigation A, then opens investigation B
- **THEN** B shows no mini-map

#### Scenario: Corrupted preference
- **WHEN** the stored display options are not valid JSON and an investigation is opened
- **THEN** every option is checked, the mini-map is shown and the graph is shown as by default

### Requirement: Changed display signalled and reset
While at least one option of the menu is unchecked, the "Affichage" button SHALL show a dot and
"Réinitialiser l'affichage" SHALL be enabled; choosing it SHALL check every option of the menu
again. While every option is checked, the button SHALL show no dot and the item SHALL be disabled.
The mini-map SHALL count for neither: hiding it shows no dot, and the reset leaves it as it is.

#### Scenario: Dot shown
- **WHEN** the user unchecks "Libellés des relations"
- **THEN** the "Affichage" button shows a dot

#### Scenario: Reset
- **WHEN** "Cotations" is unchecked, the mini-map is hidden and the user chooses "Réinitialiser l'affichage"
- **THEN** every option is checked, the ratings are shown, the mini-map stays hidden and the "Affichage" button shows no dot

#### Scenario: Nothing to reset
- **WHEN** every option is checked and the user opens "Affichage"
- **THEN** "Réinitialiser l'affichage" is disabled
