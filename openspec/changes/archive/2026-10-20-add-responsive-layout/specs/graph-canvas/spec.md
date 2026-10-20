# Spec Delta

## MODIFIED Requirements

### Requirement: Display the investigation graph
The graph view SHALL display every entity of the investigation as a node and every relation as a
link between its two entities, with pan, zoom, zoom controls and a mini-map. On narrow screens
(see responsive-layout) the mini-map SHALL be hidden.

#### Scenario: Existing graph
- **WHEN** an investigation with 10 entities and 9 relations is opened
- **THEN** 10 nodes and 9 links are displayed and the view fits the whole graph

#### Scenario: Empty graph
- **WHEN** an investigation without entities is opened
- **THEN** a hint explains how to add the first entity and the view does not jump when it is added

#### Scenario: Mini-map on a narrow screen
- **WHEN** an investigation is opened in a 412 px wide viewport
- **THEN** no mini-map is shown, and the zoom controls are

### Requirement: Add an entity
The user SHALL be able to add an entity by double-clicking the empty canvas, by a long press (at
least 500 ms without moving) on the empty canvas with a finger, or with the "Entité" button. A
dialog asks for a type and an optional label; the entity is placed at the clicked or pressed point
(or the view centre) and becomes selected.

#### Scenario: Double-click on the canvas
- **WHEN** the user double-clicks an empty area, picks "Email", types a label and clicks "Ajouter"
- **THEN** an Email node with that label appears at that point and is selected

#### Scenario: Long press on the canvas
- **WHEN** the user presses an empty area of the canvas with a finger for 600 ms, types a label and taps "Ajouter"
- **THEN** a node with that label appears at that point and is selected

#### Scenario: Press that moves
- **WHEN** the user presses the canvas with a finger and moves it by 30 px before 500 ms
- **THEN** the view is panned and no "Nouvelle entité" dialog opens

#### Scenario: Short tap
- **WHEN** the user taps an empty area of the canvas
- **THEN** no "Nouvelle entité" dialog opens

#### Scenario: Last type remembered
- **WHEN** the user adds an entity of type "Domaine" then opens the dialog again
- **THEN** the type field is preset to "Domaine"

### Requirement: Selection drives the detail panel
Selecting exactly one entity or one relation SHALL show its editor in the detail panel. Selecting
several elements SHALL show how many are selected. With no selection the panel SHALL invite the
user to select an element; on narrow screens the detail panel is the bottom drawer described in
responsive-layout, hidden while nothing is selected.

#### Scenario: Multiple selection
- **WHEN** the user selects two nodes and one link
- **THEN** the detail panel reads "3 éléments sélectionnés. Suppr pour les supprimer."

#### Scenario: Nothing selected on a wide screen
- **WHEN** an investigation is opened in a 1280 px wide viewport and nothing is selected
- **THEN** the side panel reads "Sélectionnez une entité ou une relation pour la modifier."

### Requirement: Delete selected elements
Pressing Delete or Backspace SHALL delete the selected entities and relations. The detail panel of
a multiple selection SHALL offer a "Supprimer la sélection" button doing the same. Deleting an
entity SHALL also delete every relation attached to it.

#### Scenario: Delete an entity with the keyboard
- **WHEN** entity A is linked to entity B, the user selects A and presses Delete
- **THEN** A and the relation A–B are removed, B remains

#### Scenario: Delete a multiple selection from the panel
- **WHEN** entities A and B are selected, C is linked to A, and the user activates "Supprimer la sélection"
- **THEN** A, B and the relation A–C are removed, C remains, and one undo brings all three back
