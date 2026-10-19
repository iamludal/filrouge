# Spec Delta

## Purpose

Defines the interactive graph view of an open investigation: how entities and relations are
displayed, added, moved, selected and deleted on the canvas.

## ADDED Requirements

### Requirement: Display the investigation graph
The graph view SHALL display every entity of the investigation as a node and every relation as a
link between its two entities, with pan, zoom, zoom controls and a mini-map.

#### Scenario: Existing graph
- **WHEN** an investigation with 10 entities and 9 relations is opened
- **THEN** 10 nodes and 9 links are displayed and the view fits the whole graph

#### Scenario: Empty graph
- **WHEN** an investigation without entities is opened
- **THEN** a hint explains how to add the first entity and the view does not jump when it is added

### Requirement: Entity node appearance
Each node SHALL show its entity type's icon and colour and the entity label. An entity without a
label SHALL be shown as "<type label> sans nom".

#### Scenario: Unlabelled entity
- **WHEN** an entity of type "Personne" has an empty label
- **THEN** its node reads "Personne sans nom"

### Requirement: Add an entity
The user SHALL be able to add an entity by double-clicking the empty canvas or with the "Entité"
button. A dialog asks for a type and an optional label; the entity is placed at the clicked point
(or the view centre) and becomes selected.

#### Scenario: Double-click on the canvas
- **WHEN** the user double-clicks an empty area, picks "Email", types a label and clicks "Ajouter"
- **THEN** an Email node with that label appears at that point and is selected

#### Scenario: Last type remembered
- **WHEN** the user adds an entity of type "Domaine" then opens the dialog again
- **THEN** the type field is preset to "Domaine"

### Requirement: Move entities on a grid
The user SHALL be able to drag nodes. Positions SHALL snap to a 16-pixel grid and SHALL be
persisted when the drag ends.

#### Scenario: Drag a node
- **WHEN** the user drags a node and releases it, then reloads the page
- **THEN** the node is at its new grid-aligned position

### Requirement: Selection drives the detail panel
Selecting exactly one entity or one relation SHALL show its editor in the detail panel. Selecting
several elements SHALL show how many are selected. With no selection the panel SHALL invite the
user to select an element.

#### Scenario: Multiple selection
- **WHEN** the user selects two nodes and one link
- **THEN** the detail panel reads "3 éléments sélectionnés. Suppr pour les supprimer."

### Requirement: Delete selected elements
Pressing Delete or Backspace SHALL delete the selected entities and relations. Deleting an entity
SHALL also delete every relation attached to it.

#### Scenario: Delete an entity with the keyboard
- **WHEN** entity A is linked to entity B, the user selects A and presses Delete
- **THEN** A and the relation A–B are removed, B remains
