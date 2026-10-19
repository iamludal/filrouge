# Spec Delta

## MODIFIED Requirements

### Requirement: Browser-only storage
All investigation data, sources and screenshots included, SHALL be stored in the browser's
IndexedDB for the application's origin. No data SHALL be sent to a server.

#### Scenario: Data survives a reload
- **WHEN** the user creates entities and relations, waits for "Enregistré" and reloads the page
- **THEN** the same entities, relations, properties, tags and notes are displayed

#### Scenario: Sources survive a reload
- **WHEN** the user creates a source with a screenshot, attaches it to an entity, waits for "Enregistré" and reloads the page
- **THEN** the entity still lists the source and its screenshot is displayed

### Requirement: Automatic saving
Graph edits, source edits included, SHALL be saved automatically about 400 ms after the last
change, without user action. Saves SHALL be applied in order, and a batch of edits SHALL be
written atomically, a source and its screenshot together.

#### Scenario: Burst of edits
- **WHEN** the user types several characters in a label within 400 ms
- **THEN** a single save is performed after the last keystroke

#### Scenario: Source and screenshot saved together
- **WHEN** the user saves a new source with a screenshot and the save fails
- **THEN** neither the source nor the screenshot is stored, and both are written by the next successful save

### Requirement: Validation before write
Every entity, relation, source and screenshot SHALL be validated against the data model before
being written, and SHALL belong to the investigation being saved; an invalid record SHALL fail the
whole save. A saved element SHALL NOT reference a source that does not exist.

#### Scenario: Malformed record
- **WHEN** a save contains an entity with an unknown type
- **THEN** nothing from that save is written and the status shows the failure

#### Scenario: Dangling source reference
- **WHEN** a save contains an entity referencing a source id that is neither stored nor part of the save
- **THEN** nothing from that save is written and the status shows the failure

### Requirement: Cascade deletion
Deleting an entity SHALL delete the relations attached to it in storage, even if they were not
explicitly listed. Deleting a source or replacing its screenshot SHALL delete the previous
screenshot from storage. Every write SHALL update the investigation's modification date.

#### Scenario: Stored cascade
- **WHEN** entity A, linked to B, is deleted and the page is reloaded
- **THEN** no relation referencing A remains

#### Scenario: Screenshot deleted with its source
- **WHEN** a source with a screenshot is deleted and the save completes
- **THEN** no screenshot of that source remains in storage
