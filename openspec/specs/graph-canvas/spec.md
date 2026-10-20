# graph-canvas Specification

## Purpose
Defines the interactive graph view of an open investigation: how entities and relations are
displayed, added, moved, selected and deleted on the canvas.

## Requirements

### Requirement: Display the investigation graph
The graph view SHALL display every entity of the investigation as a node and every relation as a
link between its two entities, with pan, zoom, zoom controls and a mini-map. The mini-map SHALL
draw each entity in its own colour (see entity-appearance). On narrow screens (see
responsive-layout) the mini-map SHALL be hidden.

#### Scenario: Existing graph
- **WHEN** an investigation with 10 entities and 9 relations is opened
- **THEN** 10 nodes and 9 links are displayed and the view fits the whole graph

#### Scenario: Empty graph
- **WHEN** an investigation without entities is opened
- **THEN** a hint explains how to add the first entity and the view does not jump when it is added

#### Scenario: Mini-map on a narrow screen
- **WHEN** an investigation is opened in a 412 px wide viewport
- **THEN** no mini-map is shown, and the zoom controls are

#### Scenario: Mini-map colour
- **WHEN** a "Personne" entity has the custom colour "Rouge"
- **THEN** the mini-map draws it in red

### Requirement: Entity node appearance
Each node SHALL show the entity's icon and colour (its custom ones, otherwise its type's, see
entity-appearance) and the entity label. An entity without a label SHALL be shown as "<type label>
sans nom". A hypothetical entity SHALL have a dashed circle and a verified entity a solid one. A
graded entity SHALL show its grade (e.g. "B2") in a badge on its node; an ungraded entity SHALL
show no badge. An important entity SHALL show a 24 px flag badge, named "Important", at the top
left of its circle, and its circle's border SHALL grow outwards from 2 to 4 px, so the circle
looks larger without moving its relations, and get a translucent background of the entity's
colour; an unmarked entity SHALL show none of them.

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

#### Scenario: Styled entity
- **WHEN** a "Personne" entity has the custom colour "Rouge" and the custom icon "Crâne"
- **THEN** its node circle border and icon are red and the icon is the skull

#### Scenario: Important entity
- **WHEN** an entity graded "B2" is marked important
- **THEN** its node shows both the "B2" badge and a flag badge named "Important", without overlap

#### Scenario: Unmarked entity
- **WHEN** an entity is not marked important
- **THEN** its node shows no flag badge

#### Scenario: Important entity stands out
- **WHEN** an entity is marked important
- **THEN** its circle border grows outwards to 4 px with the circle's centre unchanged, its background is tinted with the entity's colour and its flag badge is 24 px wide

#### Scenario: Tint follows the mark
- **WHEN** an important entity's mark is removed
- **THEN** its circle has a 2 px border and the plain card background again

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
Hovering a node's grade badge or a graded link label SHALL show the full meaning of the grade in
the active language, and the badge SHALL expose the same text to assistive technologies.

#### Scenario: Hover a badge
- **WHEN** the user hovers the "B2" badge of a node
- **THEN** the text "Cotation B2 : source habituellement fiable, information probablement vraie" is shown

#### Scenario: Hover a badge in English
- **WHEN** the interface is in English and the user hovers the "B2" badge of a node
- **THEN** the text "Rating B2: usually reliable source, probably true information" is shown

#### Scenario: Confirmed information in English
- **WHEN** the interface is in English and the user hovers the "A1" badge of a node
- **THEN** the text "Rating A1: completely reliable source, information confirmed by other sources" is shown
