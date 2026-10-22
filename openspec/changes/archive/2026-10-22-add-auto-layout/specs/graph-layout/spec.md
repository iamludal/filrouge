# Spec Delta

## Purpose

Lets the user rearrange the graph of an investigation automatically, as a whole or for a selection,
with an organic, hierarchical or radial layout, without losing the ability to undo it.

## ADDED Requirements

### Requirement: Layout menu
On wide screens, the graph toolbar SHALL show a "Mise en page" menu button after "Affichage". Its
menu SHALL list "Organique", "Hiérarchique" and "Radial", each with an icon. The button SHALL be
disabled while the investigation has fewer than two entities. The menu SHALL be usable with the
keyboard.

#### Scenario: Menu items
- **WHEN** an investigation with 5 entities is opened in a 1280 px wide viewport and the user opens "Mise en page"
- **THEN** the menu lists "Organique", "Hiérarchique" and "Radial"

#### Scenario: Menu in English
- **WHEN** the interface is in English and the user opens "Layout"
- **THEN** the menu lists "Organic", "Hierarchical" and "Radial"

#### Scenario: Too few entities
- **WHEN** an investigation with a single entity is opened
- **THEN** the "Mise en page" button is disabled

#### Scenario: Keyboard
- **WHEN** the user focuses "Mise en page", presses Enter, moves to "Radial" with the arrow keys and presses Enter
- **THEN** the radial layout is applied

### Requirement: Organic layout
"Organique" SHALL place entities so that linked entities are close to each other and no two
entities overlap. The same graph SHALL always get the same layout.

#### Scenario: Linked entities close together
- **WHEN** A is linked to B, C is linked to D, A–B and C–D are not linked, and the user applies "Organique"
- **THEN** A is closer to B than to C or D, and C is closer to D than to A or B

#### Scenario: No overlap
- **WHEN** the user applies "Organique" to 30 entities that all sit at the same position
- **THEN** no two entity circles overlap

#### Scenario: Deterministic
- **WHEN** the user applies "Organique", undoes, and applies "Organique" again
- **THEN** every entity gets the same position both times

### Requirement: Hierarchical layout
"Hiérarchique" SHALL place entities in horizontal layers from top to bottom, so that each relation
goes from an upper layer to a lower one wherever cycles allow. A directed relation SHALL point
downwards; an undirected relation SHALL be treated as going from its first entity to its second.

#### Scenario: Directed chain
- **WHEN** A → B and B → C are directed relations and the user applies "Hiérarchique"
- **THEN** A is above B and B is above C

#### Scenario: Undirected relation
- **WHEN** an undirected relation was created from A to B and the user applies "Hiérarchique"
- **THEN** A is above B

#### Scenario: Cycle
- **WHEN** A → B, B → C and C → A are directed relations and the user applies "Hiérarchique"
- **THEN** the layout is applied, with A, B and C on at least two different layers and no overlap

### Requirement: Radial layout
"Radial" SHALL place the centre entity in the middle and every other entity of its group on a
circle around it, one circle per number of relations separating it from the centre, the circles
growing outwards. Entities reached through the same entity SHALL stay next to each other on their
circle.

#### Scenario: Rings by distance
- **WHEN** C is the centre, C is linked to A and B, A is linked to D, and the user applies "Radial"
- **THEN** A and B are at the same distance from C, and D is farther from C than A

#### Scenario: Branches kept together
- **WHEN** C is the centre, A and B are linked to C, A1 and A2 to A, B1 and B2 to B
- **THEN** on the outer circle, A1 and A2 are next to each other and B1 and B2 are next to each other

### Requirement: Radial centre
The radial centre SHALL be the selected entity when exactly one entity is selected. Otherwise it
SHALL be, among the entities laid out, the important entity with the most relations; with no
important entity, the entity with the most relations. Ties SHALL go to the oldest entity.

#### Scenario: Selected entity
- **WHEN** entity T is the only selected entity and the user applies "Radial"
- **THEN** T is the centre and every other entity linked to T, directly or not, is on a circle around it

#### Scenario: Important entity
- **WHEN** nothing is selected, important entity I has 3 relations and entity H, not important, has 6, and the user applies "Radial"
- **THEN** I is the centre

#### Scenario: Most relations
- **WHEN** nothing is selected, no entity is important and H has the most relations
- **THEN** H is the centre

#### Scenario: Tie
- **WHEN** nothing is selected, no entity is important, and A and B both have the most relations, A created before B
- **THEN** A is the centre

#### Scenario: Centre within a selection
- **WHEN** entities A, B and C are selected, B has the most relations among the relations between them
- **THEN** B is the centre

### Requirement: Layout scope
With no entity or exactly one entity selected, a layout SHALL apply to every entity of the
investigation, filtered-out ones included. With two or more entities selected, it SHALL apply only
to them, using only the relations between them; the other entities SHALL NOT move, and the laid-out
entities SHALL be centred where the selected entities were.

#### Scenario: Whole graph
- **WHEN** nothing is selected and the user applies "Organique"
- **THEN** every entity can move

#### Scenario: One entity selected
- **WHEN** only entity A is selected and the user applies "Hiérarchique"
- **THEN** every entity can move, as with no selection

#### Scenario: Selection
- **WHEN** entities A, B and C are selected, D is not, and the user applies "Organique"
- **THEN** D keeps its position, and the centre of the box around A, B and C stays where it was, give or take one grid step

#### Scenario: Selected relation only
- **WHEN** only a relation is selected and the user applies "Organique"
- **THEN** every entity can move, as with no selection

#### Scenario: Filtered-out entities
- **WHEN** a filter dims entity E and the user applies "Organique" with nothing selected
- **THEN** E is laid out with the others and stays dimmed

### Requirement: Disconnected groups
A layout SHALL lay out each group of linked entities separately, then place the groups side by side
without overlap, largest group first. Entities without any relation SHALL be placed after the
groups, aligned in a grid. For "Radial", only the group of the centre SHALL be laid out on circles.

#### Scenario: Two groups and orphans
- **WHEN** A–B–C are linked, D–E are linked, F and G have no relation, and the user applies "Organique"
- **THEN** the boxes around A–B–C, around D–E and around F–G do not overlap, and F and G are on the same row or column of a grid

#### Scenario: Largest group first
- **WHEN** the graph has a group of 5 entities and a group of 2 entities
- **THEN** the group of 5 is placed first, at the top left of the result

#### Scenario: Radial with another group
- **WHEN** C is the centre, A is linked to C, and D–E are linked to each other only
- **THEN** A is on a circle around C, and D and E are placed beside that group, not on its circles

### Requirement: Applying a layout
A layout SHALL be applied at once, as one undo step, saved like a moved entity, with every position
on the 16 px grid, and SHALL NOT change any entity's last-modified date. After it, the view SHALL
fit the laid-out entities.

#### Scenario: Undo
- **WHEN** the user applies "Radial" and presses Cmd/Ctrl+Z
- **THEN** every entity is back at its previous position, in one undo

#### Scenario: Saved
- **WHEN** the user applies "Organique" and reloads the page
- **THEN** every entity is at its laid-out position

#### Scenario: Grid
- **WHEN** a layout is applied
- **THEN** both coordinates of every stored position are multiples of 16

#### Scenario: Last-modified date
- **WHEN** a layout moves entity A
- **THEN** A's `updatedAt` is unchanged

#### Scenario: View fits the result
- **WHEN** a layout is applied to the whole graph
- **THEN** every entity is visible in the view

### Requirement: Animated transition
After a layout, the entities SHALL glide from their old to their new positions in about 300 ms.
When the system asks for reduced motion, they SHALL move at once. An undo, a redo or any edit
during the transition SHALL end it at once.

#### Scenario: Glide
- **WHEN** the user applies "Organique"
- **THEN** 100 ms later the entities are between their old and new positions, and 500 ms later they are at their new positions

#### Scenario: Reduced motion
- **WHEN** the system asks for reduced motion and the user applies "Organique"
- **THEN** the entities are at their new positions in the next frame

#### Scenario: Undo during the transition
- **WHEN** the user applies "Radial" and presses Cmd/Ctrl+Z 100 ms later
- **THEN** every entity is shown at its position before the layout

### Requirement: Long layout
While a layout has been computing for more than about 300 ms, a "Mise en page…" notice SHALL be
shown with an "Annuler" button, and the interface SHALL stay usable. "Annuler" SHALL stop the
layout without moving any entity. A layout that fails SHALL move no entity and show "La mise en
page a échoué".

#### Scenario: Notice
- **WHEN** a layout takes 2 seconds
- **THEN** the "Mise en page…" notice is shown during the computation and disappears when it is applied

#### Scenario: Cancel
- **WHEN** the user clicks "Annuler" in the "Mise en page…" notice
- **THEN** no entity moves and no undo step is added

#### Scenario: Fast layout
- **WHEN** a layout takes 50 ms
- **THEN** no notice is shown

#### Scenario: Failure
- **WHEN** the layout computation fails
- **THEN** no entity moves and the notice "La mise en page a échoué" is shown

### Requirement: Graph changed during a layout
If the investigation's entities or relations change while a layout is being computed, its result
SHALL be dropped: no entity moves and the notice "Graphe modifié pendant le calcul : mise en page
annulée" is shown. Starting a new layout SHALL drop the one in progress silently.

#### Scenario: Entity deleted during the computation
- **WHEN** the user starts a layout and deletes an entity before it is applied
- **THEN** no other entity moves and the "Graphe modifié pendant le calcul : mise en page annulée" notice is shown

#### Scenario: Selection change during the computation
- **WHEN** the user starts a layout and selects another entity before it is applied
- **THEN** the layout is applied

#### Scenario: New layout during the computation
- **WHEN** the user starts "Organique" then "Radial" before the first is applied
- **THEN** only "Radial" is applied and no "modifié" notice is shown

### Requirement: Layout without network
Computing a layout SHALL make no network request, and the layout code SHALL be loaded only when
the user first applies a layout.

#### Scenario: No request
- **WHEN** the user applies each of the three layouts
- **THEN** no request leaves the application's origin

#### Scenario: Loaded on demand
- **WHEN** an investigation is opened and no layout is applied
- **THEN** the layout code is not downloaded
