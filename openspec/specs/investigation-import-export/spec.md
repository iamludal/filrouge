# investigation-import-export Specification

## Purpose
Lets the user back up, move and share an investigation as a single versioned JSON file, and
import such files safely even when they come from an untrusted source.

## Requirements

### Requirement: Export an investigation
The user SHALL be able to export an investigation from the home screen menu ("Exporter en JSON")
or the graph view ("Exporter"). The file SHALL be downloaded locally, named after the
investigation with only letters, digits, dashes and underscores, ending in `.filrouge.json`.

#### Scenario: Export from the graph view
- **WHEN** the user clicks "Exporter" in the investigation "Opération Fil Rouge"
- **THEN** a file `Opération-Fil-Rouge.filrouge.json` is downloaded, including the latest edits

### Requirement: Export file format
The file SHALL be JSON with `format` "filrouge.investigation", `schemaVersion` 1, `exportedAt`, the
investigation, and its entities, relations and sources. Attachments SHALL NOT be included.

#### Scenario: File content
- **WHEN** an investigation with 10 entities and 9 relations is exported
- **THEN** the file has `format` "filrouge.investigation", `schemaVersion` 1, 10 entities and 9 relations

### Requirement: Lossless round trip
Exporting, deleting the investigation, re-importing the file and exporting again SHALL produce the
same content apart from `exportedAt`.

#### Scenario: Round trip
- **WHEN** an exported investigation is deleted, re-imported and exported again
- **THEN** both files are identical except for `exportedAt`

### Requirement: Import validation
An imported file SHALL be fully validated before anything is stored; any invalid file SHALL be
rejected as a whole, with at most five short error messages shown to the user.

#### Scenario: Invalid structure
- **WHEN** the user imports a file whose `entities` field is not a list
- **THEN** "Import refusé : fichier invalide" is shown and no investigation is created

#### Scenario: Not JSON
- **WHEN** the user imports a file that is not valid JSON
- **THEN** the import is rejected with "Le fichier n’est pas un JSON valide"

### Requirement: Import integrity checks
Import SHALL reject files containing duplicate ids, records belonging to another investigation,
relations to unknown entities, or references to unknown sources.

#### Scenario: Duplicate id
- **WHEN** two entities in the file share the same id
- **THEN** the import is rejected

### Requirement: Import size and version limits
Import SHALL reject files larger than 50 MB and files whose `schemaVersion` is newer than the one
supported, with an explicit message.

#### Scenario: Newer version
- **WHEN** the file has `schemaVersion` 2
- **THEN** the import is rejected with a message saying it was produced by a newer filrouge

#### Scenario: Too large
- **WHEN** the file is larger than 50 MB
- **THEN** the import is rejected with "Fichier trop volumineux (50 Mo maximum)"

### Requirement: Import as a copy
When the imported investigation's id already exists in this browser, the import SHALL create a
copy with new ids for every record, preserving all links, and tell the user it was imported as a
copy. The existing investigation SHALL be left untouched.

#### Scenario: Import the same file twice
- **WHEN** the user imports a file whose investigation is already stored
- **THEN** a second investigation with the same content appears and "Enquête importée comme copie (elle existait déjà)" is shown
