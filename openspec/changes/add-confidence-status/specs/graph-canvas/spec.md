# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
