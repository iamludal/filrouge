# Spec Delta

## MODIFIED Requirements

### Requirement: Undoable edits
Every edit to the open investigation's entities, relations and sources SHALL be undoable:
creating, editing, moving and deleting entities and relations, checking and unchecking a tool on
an entity, and creating, editing, deleting, attaching and detaching sources, screenshot changes
included. Undoing SHALL restore the graph exactly as it was before the edit; redoing SHALL apply
the edit again.

#### Scenario: Undo a deletion
- **WHEN** entity A, linked to B by relation R, is deleted and the user presses Cmd/Ctrl+Z
- **THEN** A and R are displayed again with their label, properties, tags, notes, position and sources

#### Scenario: Redo a deletion
- **WHEN** the user undoes the deletion of A and presses Cmd/Ctrl+Shift+Z
- **THEN** A and R are deleted again

#### Scenario: Undo a move
- **WHEN** the user drags A to another place and presses Cmd/Ctrl+Z
- **THEN** A is back at its previous position

#### Scenario: Undo a source deletion
- **WHEN** source S with a screenshot, attached to A, is deleted, the save completes, and the user undoes
- **THEN** A lists S again and S's screenshot is displayed with the same SHA-256

#### Scenario: Undo attaching a source
- **WHEN** the user attaches source S to A and undoes
- **THEN** S is no longer listed for A and is still in the investigation's sources

#### Scenario: Undo unchecking a tool
- **WHEN** crt.sh, checked on A yesterday, is unchecked and the user undoes
- **THEN** crt.sh is checked again on A with yesterday's date

### Requirement: Step grouping
Each user action SHALL be one history step, whatever the number of records it changes. Consecutive
changes to the same field of the same element, each less than one second after the previous one,
SHALL form a single step, except tool checks: each check or uncheck SHALL be its own step.

#### Scenario: Typing a label
- **WHEN** the user types "Jean Dupont" in A's label field, then leaves the field and undoes
- **THEN** A's label is back to its value before typing, in one undo

#### Scenario: Separate fields
- **WHEN** the user edits A's label, then A's notes, and undoes once
- **THEN** only the notes edit is reverted

#### Scenario: Multi-node drag
- **WHEN** the user drags three selected nodes together and undoes once
- **THEN** the three nodes are back at their previous positions

#### Scenario: Cascade deletion
- **WHEN** the user deletes entity A, which removes its three relations, and undoes once
- **THEN** A and its three relations are restored

#### Scenario: Quick successive checks
- **WHEN** the user checks crt.sh then Shodan on A within one second, and undoes once
- **THEN** only Shodan is unchecked
