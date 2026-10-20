# edit-history Specification

## Purpose

Lets the user undo and redo their edits to the open investigation's graph, so that a mistaken
change, saved automatically, can be reverted.

## Requirements

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

### Requirement: Edits outside the history
Selection, viewport (pan and zoom), the investigation's name, import and export SHALL NOT be
recorded: undo and redo SHALL neither change nor revert them.

#### Scenario: Selection is not a step
- **WHEN** the user creates entity A, then selects entity B, and presses Cmd/Ctrl+Z
- **THEN** A is removed and no other change is reverted

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

### Requirement: Keyboard shortcuts
On the graph view, Cmd/Ctrl+Z SHALL undo, and Cmd/Ctrl+Shift+Z and Ctrl+Y SHALL redo. These
shortcuts SHALL do nothing to the graph while focus is in a text field, where the browser's own
text undo applies, or while a dialog is open.

#### Scenario: Shortcut on the canvas
- **WHEN** focus is on the canvas, the user has just created an entity and presses Cmd/Ctrl+Z
- **THEN** the entity is removed

#### Scenario: Shortcut in a text field
- **WHEN** focus is in A's notes field and the user presses Cmd/Ctrl+Z
- **THEN** no graph edit is undone

#### Scenario: Shortcut with a dialog open
- **WHEN** the "Ajouter une entité" dialog is open and the user presses Cmd/Ctrl+Z
- **THEN** no graph edit is undone

### Requirement: Toolbar buttons
The graph toolbar SHALL show "Annuler" and "Rétablir" as icon-only buttons, whose accessible
names are "Annuler" and "Rétablir". A tooltip SHALL show the action and its shortcut on hover,
disabled buttons included, and on keyboard focus. Each button SHALL be disabled when there is
nothing to undo, or to redo.

#### Scenario: Icon with tooltip
- **WHEN** the user hovers the "Annuler" button
- **THEN** the button shows only an icon and a tooltip reads "Annuler (⌘Z)" on macOS, "Annuler (Ctrl+Z)" elsewhere

#### Scenario: Tooltip on keyboard focus
- **WHEN** the user has an edit to redo and moves focus to "Rétablir" with Tab
- **THEN** a tooltip reads "Rétablir (⇧⌘Z)" on macOS, "Rétablir (Ctrl+Shift+Z)" elsewhere

#### Scenario: Tooltip on a disabled button
- **WHEN** an investigation has just been opened and the user hovers the disabled "Annuler" button
- **THEN** the tooltip is shown

#### Scenario: Freshly opened investigation
- **WHEN** an investigation is opened
- **THEN** "Annuler" and "Rétablir" are both disabled

#### Scenario: Buttons follow the history
- **WHEN** the user creates an entity, then clicks "Annuler"
- **THEN** the entity is removed, "Annuler" is disabled and "Rétablir" is enabled

### Requirement: New edit clears redo
Making a new edit after undoing SHALL discard the steps that could have been redone.

#### Scenario: Branching
- **WHEN** the user creates A, undoes, then creates B
- **THEN** "Rétablir" is disabled and A cannot be brought back

### Requirement: Undone states are saved
The state reached by undo or redo SHALL be saved automatically like any other edit, and SHALL
survive a reload.

#### Scenario: Undo then reload
- **WHEN** the user deletes A, undoes, waits for "Enregistré" and reloads the page
- **THEN** A is displayed with its relations and sources

### Requirement: History lifetime and limit
The history SHALL be kept in memory for the open investigation only. It SHALL be empty when an
investigation is opened, and dropped when the user leaves it or reloads the page. It SHALL keep
at most the 100 most recent steps.

#### Scenario: History dropped on leave
- **WHEN** the user edits investigation I, goes back to the home screen and opens I again
- **THEN** "Annuler" is disabled

#### Scenario: Oldest steps dropped
- **WHEN** the user creates 101 entities one by one and undoes as many times as possible
- **THEN** the first entity created is still displayed
