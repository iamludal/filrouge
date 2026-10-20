# Spec Delta

## MODIFIED Requirements

### Requirement: Entity drawing
Each entity SHALL be drawn as on the canvas: a circle bordered with the entity's colour holding the
entity's icon (its custom ones, otherwise its type's, see entity-appearance), its label below (or
"<type label> sans nom" when empty), a dashed border when it is a hypothesis and a solid one when
verified, its grade (e.g. "B2") in a badge when graded, and, when it is important, a
flag badge and a circle whose border grows outwards to 4 px, filled with a light shade of the entity's colour. A
label longer than 24 characters SHALL be cut to its first 23 characters followed by "…".

#### Scenario: Unlabelled entity
- **WHEN** the graph holds a "Personne" entity with an empty label and the user exports the SVG
- **THEN** the SVG holds the text "Personne sans nom"

#### Scenario: Hypothetical and verified entities
- **WHEN** entity A is a hypothesis, entity B is verified and the user exports the SVG
- **THEN** A's circle is drawn with a dashed stroke and B's with a solid stroke

#### Scenario: Graded entity
- **WHEN** an entity is graded "B2" and the user exports the SVG
- **THEN** the SVG holds the text "B2" next to that entity's circle

#### Scenario: Long label
- **WHEN** an entity's label is "Société anonyme des transports réunis" and the user exports the SVG
- **THEN** the SVG holds the text "Société anonyme des tra…" and not the full label

#### Scenario: Styled entity
- **WHEN** a "Personne" entity has the custom colour "Rouge" and the custom icon "Crâne" and the user exports the SVG
- **THEN** that entity's circle stroke and icon use the palette red, and the icon drawn is the skull, not the person icon

#### Scenario: Important entity
- **WHEN** entity A is important, entity B is not, and the user exports the SVG
- **THEN** a flag badge is drawn at the top left of A's circle and none next to B's, and the badge lies inside the image bounds

#### Scenario: Important entity tinted
- **WHEN** entity A is important, entity B is not, and the user exports the SVG
- **THEN** A's circle has a 4 px stroke reaching 2 px beyond its edge and a light fill of A's colour, and B's circle a 2 px stroke and a white fill
