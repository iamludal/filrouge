# investigation-import-export Specification

## Purpose
Lets the user back up, move and share an investigation as a single versioned JSON file, and
import such files safely even when they come from an untrusted source.

## Requirements

### Requirement: Export an investigation
The user SHALL be able to export an investigation from the home screen menu ("Exporter en JSON")
or the graph view ("Exporter"). The file SHALL be downloaded locally, named after the
investigation with only letters, digits, dashes and underscores, ending in `.filrouge.json`.
When the investigation holds at least one screenshot, a dialog SHALL first offer "Inclure les
captures", checked by default and showing their number and total size.

#### Scenario: Export from the graph view
- **WHEN** the user clicks "Exporter" in the investigation "Opération Fil Rouge"
- **THEN** a file `Opération-Fil-Rouge.filrouge.json` is downloaded, including the latest edits

#### Scenario: No screenshot, no dialog
- **WHEN** the user exports an investigation without any screenshot
- **THEN** the file is downloaded directly, without the dialog

#### Scenario: Export without screenshots
- **WHEN** the investigation has 2 screenshots, the user clicks "Exporter", unchecks "Inclure les captures (2, 3,4 Mo)" and confirms
- **THEN** the downloaded file contains no screenshot

### Requirement: Export file format
The file SHALL be JSON with `format` "filrouge.investigation", `schemaVersion` 1, `exportedAt`, the
investigation, its entities, relations and sources, and an `attachments` list. When screenshots
are included, each SHALL carry its id, format, size, SHA-256, original SHA-256 and size if
optimized, and base64 content. When they are not, the list SHALL be empty and sources SHALL keep
their fingerprints but no screenshot reference. On import, a missing `attachments` list SHALL be
read as empty.

#### Scenario: File content
- **WHEN** an investigation with 10 entities and 9 relations is exported
- **THEN** the file has `format` "filrouge.investigation", `schemaVersion` 1, 10 entities and 9 relations

#### Scenario: File without attachments list
- **WHEN** the user imports a valid file that has no `attachments` field
- **THEN** the investigation is created with its entities, relations and sources, and no screenshot

#### Scenario: Screenshots included
- **WHEN** an investigation whose source S holds a screenshot is exported with "Inclure les captures"
- **THEN** `attachments` holds one item whose SHA-256 equals S's, and S references it

#### Scenario: Screenshots excluded
- **WHEN** the same investigation is exported without screenshots
- **THEN** `attachments` is empty and S keeps its SHA-256 without referencing any attachment

### Requirement: Lossless round trip
Exporting, deleting the investigation, re-importing the file and exporting again with the same
screenshot option SHALL produce the same content apart from `exportedAt`. With screenshots
included, re-imported screenshots SHALL have the same bytes.

#### Scenario: Round trip
- **WHEN** an exported investigation is deleted, re-imported and exported again
- **THEN** both files are identical except for `exportedAt`

#### Scenario: Round trip with screenshots
- **WHEN** an investigation with screenshots is exported with them, deleted and re-imported
- **THEN** each screenshot is displayed again and its downloaded bytes have the original SHA-256

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
relations to unknown entities, references to unknown sources, or sources referencing an unknown
screenshot.

#### Scenario: Duplicate id
- **WHEN** two entities in the file share the same id
- **THEN** the import is rejected

#### Scenario: Unknown screenshot
- **WHEN** a source in the file references a screenshot that is not in `attachments`
- **THEN** the import is rejected

### Requirement: Import size and version limits
Import SHALL reject files larger than 200 MB and files whose `schemaVersion` is newer than the one
supported, with an explicit message.

#### Scenario: Newer version
- **WHEN** the file has `schemaVersion` 2
- **THEN** the import is rejected with a message saying it was produced by a newer filrouge

#### Scenario: Too large
- **WHEN** the file is larger than 200 MB
- **THEN** the import is rejected with "Fichier trop volumineux (200 Mo maximum)"

### Requirement: Import as a copy
When the imported investigation's id already exists in this browser, the import SHALL create a
copy with new ids for every record, screenshots included, preserving all links, and tell the user
it was imported as a copy. The existing investigation SHALL be left untouched.

#### Scenario: Import the same file twice
- **WHEN** the user imports a file whose investigation is already stored
- **THEN** a second investigation with the same content appears and "Enquête importée comme copie (elle existait déjà)" is shown

#### Scenario: Copy with screenshots
- **WHEN** the user imports twice a file with an embedded screenshot, then deletes the copy
- **THEN** the original investigation still displays its screenshot

### Requirement: Export size guard
The export dialog SHALL show the estimated file size. When screenshots are included and the
estimate exceeds the 200 MB import limit, export with screenshots SHALL be blocked with a message
suggesting to exclude them or optimize the largest ones, so that every exported file can be
re-imported.

#### Scenario: Estimated size
- **WHEN** the user exports an investigation whose screenshots total 30 MB
- **THEN** the dialog shows an estimated size of about 40 Mo

#### Scenario: Too large to re-import
- **WHEN** the screenshots of the investigation total 180 MB and "Inclure les captures" is checked
- **THEN** "Exporter" is disabled and "Fichier estimé à plus de 200 Mo : il ne pourrait pas être réimporté. Excluez les captures ou optimisez les plus lourdes." is shown

#### Scenario: Exclude to export
- **WHEN** in the same situation the user unchecks "Inclure les captures"
- **THEN** "Exporter" is enabled again

### Requirement: Embedded screenshot verification
Before anything is stored, each embedded screenshot SHALL be decoded and checked: valid base64,
an accepted image format detected from its content and matching the declared one, at most 20 MB,
declared size equal to the decoded size, and SHA-256 equal to the declared one and to its source's.
Any failure SHALL reject the whole file.

#### Scenario: Tampered screenshot
- **WHEN** the base64 content of an embedded screenshot is modified without updating its SHA-256
- **THEN** the import is rejected and no investigation is created

#### Scenario: Disguised content
- **WHEN** an embedded screenshot declared as `image/png` decodes to SVG content
- **THEN** the import is rejected
