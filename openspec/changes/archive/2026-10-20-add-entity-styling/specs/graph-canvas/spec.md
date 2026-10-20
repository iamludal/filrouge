# Spec Delta

## MODIFIED Requirements

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
show no badge. An important entity SHALL show a flag badge, named "Important", at the top left of
its circle; an unmarked entity SHALL show none.

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
