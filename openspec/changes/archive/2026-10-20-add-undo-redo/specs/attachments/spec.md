# Spec Delta

## MODIFIED Requirements

### Requirement: Replace or remove a screenshot
The user SHALL be able to replace a source's screenshot with another one or remove it. The
previous image SHALL no longer be shown or exported for that source, and SHALL be deleted from
storage with the other unreferenced screenshots. The source's fingerprint SHALL follow the new
image or be cleared.

#### Scenario: Replace
- **WHEN** the user replaces the screenshot of a source with another image, saves and leaves the investigation
- **THEN** the source shows the new image and its SHA-256, and the old image is no longer stored

#### Scenario: Remove
- **WHEN** the user clicks "Retirer la capture" and saves
- **THEN** the source has no screenshot and no fingerprint

#### Scenario: Undo a replacement
- **WHEN** the user replaces the screenshot of a source, the save completes, and the user undoes
- **THEN** the source shows the previous image and its SHA-256 again
