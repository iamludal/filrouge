# Spec Delta

## MODIFIED Requirements

### Requirement: Export an investigation
The user SHALL be able to export an investigation from the home screen menu ("Exporter en JSON")
or from the "Exporter" menu of the graph view ("JSON"). The file SHALL be downloaded locally, named
after the investigation with only letters, digits, dashes and underscores, ending in
`.filrouge.json`. When at least one source of the investigation holds a screenshot, a dialog SHALL
first offer "Inclure les captures", checked by default and showing the number and total size of the
screenshots held by its sources. Screenshots referenced by no source SHALL be neither counted nor
exported.

#### Scenario: Export from the graph view
- **WHEN** the user opens "Exporter" in the investigation "Opération Fil Rouge" and chooses "JSON"
- **THEN** a file `Opération-Fil-Rouge.filrouge.json` is downloaded, including the latest edits

#### Scenario: No screenshot, no dialog
- **WHEN** the user exports an investigation without any screenshot
- **THEN** the file is downloaded directly, without the dialog

#### Scenario: Export without screenshots
- **WHEN** the investigation has 2 screenshots, the user chooses "Exporter" > "JSON", unchecks "Inclure les captures (2, 3,4 Mo)" and confirms
- **THEN** the downloaded file contains no screenshot

#### Scenario: Released screenshot not exported
- **WHEN** the investigation has 2 sources with a screenshot, the user deletes one of them, then chooses "Exporter" > "JSON"
- **THEN** the dialog shows "Inclure les captures (1, …)" and the file holds a single screenshot
