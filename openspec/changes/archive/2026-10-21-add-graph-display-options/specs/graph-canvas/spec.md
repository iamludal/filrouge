# Spec Delta

## MODIFIED Requirements

### Requirement: Display the investigation graph
The graph view SHALL display every entity of the investigation as a node and every relation as a
link between its two entities, with pan, zoom, zoom controls and a mini-map. The mini-map SHALL
draw each entity in its own colour (see entity-appearance). On narrow screens (see
responsive-layout), or while the user has hidden it with the mini-map button (see
graph-display-options), the mini-map SHALL be hidden.

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

#### Scenario: Mini-map hidden by the user
- **WHEN** an investigation is opened in a 1280 px wide viewport with the mini-map hidden with its button
- **THEN** no mini-map is shown

### Requirement: Entity node appearance
Each node SHALL show the entity's icon and colour (its custom ones, otherwise its type's, see
entity-appearance) and the entity label. An entity without a label SHALL be shown as "<type label>
sans nom". A hypothetical entity SHALL have a dashed circle and a verified entity a solid one. A
graded entity SHALL show its grade (e.g. "B2") in a badge on its node; an ungraded entity SHALL
show no badge. An important entity SHALL show a 24 px flag badge, named "Important", at the top
left of its circle, and its circle's border SHALL grow outwards from 2 to 4 px, so the circle
looks larger without moving its relations, and get a translucent background of the entity's
colour; an unmarked entity SHALL show none of them. The label, the grade badge and the important
mark SHALL each be shown only while its display option is checked (see graph-display-options).

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

#### Scenario: Decorations hidden by the display options
- **WHEN** an important entity graded "B2" is shown with "Libellés des entités", "Cotations" and "Marque « Important »" unchecked
- **THEN** its node shows its icon and colour only: no label, no "B2" badge, no flag badge, a 2 px border and the plain card background

### Requirement: Relation link appearance
A hypothetical relation SHALL be drawn with a dashed line and a verified relation with a solid
line. A graded relation SHALL show its grade after its label, separated by " · " (e.g.
"connaît · B2"), or the grade alone when its label is empty. The link label SHALL be shown only
while "Libellés des relations" is checked, and the grade only while "Cotations" is checked (see
graph-display-options).

#### Scenario: Hypothetical relation
- **WHEN** a relation has the status "hypothesis"
- **THEN** its link is drawn dashed, with its arrow if it is directed

#### Scenario: Graded relation
- **WHEN** a relation labelled "connaît" is graded "C3"
- **THEN** its link label reads "connaît · C3"

#### Scenario: Graded relation without label
- **WHEN** a relation with an empty label is graded "A1"
- **THEN** its link label reads "A1"

#### Scenario: Line kept when labels are hidden
- **WHEN** a directed hypothetical relation is shown with "Libellés des relations" unchecked
- **THEN** its link is drawn dashed with its arrow, and without label
