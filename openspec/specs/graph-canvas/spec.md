# graph-canvas Specification

## Purpose
Defines the interactive graph view of an open investigation: how entities and relations are
displayed, added, moved, selected and deleted on the canvas.

## Requirements

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
label SHALL be shown as "<type label> sans nom". A hypothetical entity SHALL have a dashed circle
and a verified entity a solid one. A graded entity SHALL show its grade (e.g. "B2") in a badge on
its node; an ungraded entity SHALL show no badge.

#### Scenario: Unlabelled entity
- **WHEN** an entity of type "Personne" has an empty label
- **THEN** its node reads "Personne sans nom"

#### Scenario: Hypothetical entity
- **WHEN** an entity has the status "hypothesis"
- **THEN** its node circle is drawn with a dashed border

#### Scenario: Verified entity
- **WHEN** an entity has the status "verified"
- **THEN** its node circle is drawn with a solid border

#### Scenario: Graded entity
- **WHEN** an entity is graded reliability "B", credibility 2
- **THEN** its node shows a "B2" badge

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

### Requirement: Select several elements
The user SHALL be able to select several elements by Cmd/Ctrl-clicking them or by drawing a
rectangle with Shift+drag. The rectangle SHALL select every entity whose circle or label it
touches, even partially, and the links attached to those entities.

#### Scenario: Rectangle around two linked nodes
- **WHEN** the user Shift+drags a rectangle around linked entities A and B
- **THEN** A, B and the link A–B are selected

#### Scenario: Rectangle touching an entity
- **WHEN** the rectangle covers only part of an entity's circle
- **THEN** the entity is selected

#### Scenario: Rectangle beside an entity
- **WHEN** the rectangle covers only empty canvas next to an entity's circle
- **THEN** the entity is not selected

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

### Requirement: Relation link appearance
A hypothetical relation SHALL be drawn with a dashed line and a verified relation with a solid
line. A graded relation SHALL show its grade after its label, separated by " · " (e.g.
"connaît · B2"), or the grade alone when its label is empty.

#### Scenario: Hypothetical relation
- **WHEN** a relation has the status "hypothesis"
- **THEN** its link is drawn dashed, with its arrow if it is directed

#### Scenario: Graded relation
- **WHEN** a relation labelled "connaît" is graded "C3"
- **THEN** its link label reads "connaît · C3"

#### Scenario: Graded relation without label
- **WHEN** a relation with an empty label is graded "A1"
- **THEN** its link label reads "A1"

### Requirement: Grade explained on hover
Hovering a node's grade badge or a graded link label SHALL show the full French meaning of the
grade, and the badge SHALL expose the same text to assistive technologies.

#### Scenario: Hover a badge
- **WHEN** the user hovers the "B2" badge of a node
- **THEN** the text "Cotation B2 : source habituellement fiable, information probablement vraie" is shown
