# Spec Delta

## Purpose

Guarantees that investigation data lives only in the user's browser and that edits are saved
automatically, reliably and in a valid form, without any explicit "save" action.

## ADDED Requirements

### Requirement: Browser-only storage
All investigation data SHALL be stored in the browser's IndexedDB for the application's origin.
No data SHALL be sent to a server.

#### Scenario: Data survives a reload
- **WHEN** the user creates entities and relations, waits for "Enregistré" and reloads the page
- **THEN** the same entities, relations, properties, tags and notes are displayed

### Requirement: Automatic saving
Graph edits SHALL be saved automatically about 400 ms after the last change, without user action.
Saves SHALL be applied in order, and a batch of edits SHALL be written atomically.

#### Scenario: Burst of edits
- **WHEN** the user types several characters in a label within 400 ms
- **THEN** a single save is performed after the last keystroke

### Requirement: Save status
The graph view SHALL show the save state: "Enregistrement…" while edits are pending or being
written, "Enregistré" once everything is written, "Échec de l’enregistrement" after a failure.

#### Scenario: Save completes
- **WHEN** the user edits an entity and the save succeeds
- **THEN** the status shows "Enregistrement…" then "Enregistré"

### Requirement: Retry after a failed save
When a save fails, the user SHALL be notified and the unsaved edits SHALL be kept and retried with
the next save. Records deleted in the meantime SHALL NOT be recreated.

#### Scenario: Failure then new edit
- **WHEN** a save fails and the user makes another edit
- **THEN** the next save writes both the failed edits and the new one

### Requirement: Flush on leave
Pending edits SHALL be saved immediately when the user leaves the investigation, hides the tab or
closes the page (best effort), and before an export.

#### Scenario: Leave right after an edit
- **WHEN** the user edits a label and immediately goes back to the home screen
- **THEN** the edit is persisted

### Requirement: Validation before write
Every entity and relation SHALL be validated against the data model before being written, and
SHALL belong to the investigation being saved; an invalid record SHALL fail the whole save.

#### Scenario: Malformed record
- **WHEN** a save contains an entity with an unknown type
- **THEN** nothing from that save is written and the status shows the failure

### Requirement: Cascade deletion
Deleting an entity SHALL delete the relations attached to it in storage, even if they were not
explicitly listed. Every write SHALL update the investigation's modification date.

#### Scenario: Stored cascade
- **WHEN** entity A, linked to B, is deleted and the page is reloaded
- **THEN** no relation referencing A remains
