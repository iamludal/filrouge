# Spec Delta

## Purpose

Defines relations, the labelled links between two entities of an investigation, and how the user
creates, edits and deletes them.

## ADDED Requirements

### Requirement: Create a relation by dragging
The user SHALL be able to create a relation by dragging from an entity's connection handle onto
another entity; the whole target node accepts the drop. A dialog then asks for the label and the
direction.

#### Scenario: Link two entities
- **WHEN** the user drags from entity A's handle onto entity B, types "connaît" and clicks "Créer la relation"
- **THEN** a directed relation A → B labelled "connaît" is shown and selected

#### Scenario: Self-link
- **WHEN** the user drops the connection on the entity it started from
- **THEN** no relation is created

### Requirement: Relation label
A relation label SHALL be at most 500 characters. Common labels (e.g. "lié à", "utilise",
"possède", "travaille pour", "connaît") SHALL be suggested. An empty label at creation SHALL
default to "lié à".

#### Scenario: Empty label
- **WHEN** the user creates a relation without typing a label
- **THEN** the relation is labelled "lié à"

### Requirement: Relation direction
A relation SHALL be either directed (drawn with an arrow from source to target) or undirected.
Relations SHALL be directed by default.

#### Scenario: Undirected relation
- **WHEN** the user turns off "Orientée (flèche)" before creating the relation
- **THEN** the link is drawn without an arrow

### Requirement: Edit a relation
Selecting a relation SHALL show its two ends, its label and its direction in the detail panel;
label and direction SHALL be editable. Clicking an end SHALL select that entity.

#### Scenario: Jump to an end
- **WHEN** a relation A → B is selected and the user clicks "B" in the panel
- **THEN** entity B becomes selected and its editor is shown

### Requirement: Delete a relation
The user SHALL be able to delete a relation from its panel or with the Delete key; its entities
SHALL remain.

#### Scenario: Delete from the panel
- **WHEN** the user clicks "Supprimer la relation"
- **THEN** the link disappears and both entities remain

### Requirement: Relation integrity
A relation SHALL always connect two distinct entities of the same investigation. A relation whose
entity is deleted SHALL be deleted with it.

#### Scenario: Dangling relation in an import
- **WHEN** an imported file contains a relation pointing to an entity absent from the file
- **THEN** the import is rejected
