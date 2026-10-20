# Spec Delta

## MODIFIED Requirements

### Requirement: Content edits refresh the last-modified date
The last-modified date of an entity or relation SHALL be set to the current instant whenever its
own content changes: type, label, properties, tags, notes, status, confidence, a relation's label
or direction, its list of sources (attach, detach, or deletion of a cited source), or an entity's
tool checks (checking or unchecking a tool).

#### Scenario: Edit a property
- **WHEN** the user changes a property value of the selected entity
- **THEN** its `updatedAt` becomes the instant of the edit

#### Scenario: Attach a source to a relation
- **WHEN** the user attaches an existing source to a relation
- **THEN** the relation's `updatedAt` becomes the instant of the attachment

#### Scenario: Delete a cited source
- **WHEN** the user deletes a source cited by an entity
- **THEN** that entity's `updatedAt` becomes the instant of the deletion

#### Scenario: Check a tool
- **WHEN** the user checks a tool in the selected entity's "Outils" tab
- **THEN** the entity's `updatedAt` becomes the instant of the check, equal to the check's `checkedAt`
