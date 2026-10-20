# Spec Delta

## MODIFIED Requirements

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
