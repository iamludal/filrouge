# Spec Delta

## MODIFIED Requirements

### Requirement: Create a relation by dragging
The user SHALL be able to create a relation by dragging, with the mouse or a finger, from an
entity's connection handle onto another entity; the whole target node accepts the drop. The handle
of a selected entity SHALL always be shown, and SHALL accept a touch anywhere within 44 × 44 CSS
pixels around it. A dialog then asks for the label, the direction and whether the relation is a
hypothesis.

#### Scenario: Link two entities
- **WHEN** the user drags from entity A's handle onto entity B, types "connaît" and clicks "Créer la relation"
- **THEN** a directed relation A → B labelled "connaît" is shown and selected

#### Scenario: Link two entities with a finger
- **WHEN** on a touch screen the user taps entity A, then drags a finger from a point 15 px away from A's handle centre onto entity B
- **THEN** the "Nouvelle relation" dialog opens for A → B

#### Scenario: Self-link
- **WHEN** the user drops the connection on the entity it started from
- **THEN** no relation is created
