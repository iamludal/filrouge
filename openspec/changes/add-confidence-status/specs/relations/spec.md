# Spec Delta

## MODIFIED Requirements

### Requirement: Create a relation by dragging
The user SHALL be able to create a relation by dragging from an entity's connection handle onto
another entity; the whole target node accepts the drop. A dialog then asks for the label, the
direction and whether the relation is a hypothesis.

#### Scenario: Link two entities
- **WHEN** the user drags from entity A's handle onto entity B, types "connaît" and clicks "Créer la relation"
- **THEN** a directed relation A → B labelled "connaît" is shown and selected

#### Scenario: Self-link
- **WHEN** the user drops the connection on the entity it started from
- **THEN** no relation is created

## ADDED Requirements

### Requirement: Status chosen at creation
The "Nouvelle relation" dialog SHALL show a "Hypothèse" switch, on by default. The created
relation SHALL have the status "hypothesis" when the switch is on and "verified" when it is off,
and SHALL have no confidence grade.

#### Scenario: Default creation
- **WHEN** the user creates a relation without touching the "Hypothèse" switch
- **THEN** the relation's status is "hypothesis", it has no confidence and its link is drawn dashed

#### Scenario: Create a verified relation
- **WHEN** the user turns off "Hypothèse" before clicking "Créer la relation"
- **THEN** the relation's status is "verified" and its link is drawn solid
