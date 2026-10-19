# Spec Delta

## MODIFIED Requirements

### Requirement: Cascade deletion
Deleting an entity SHALL delete the relations attached to it in storage, even if they were not
explicitly listed. Every write SHALL update the investigation's modification date.

#### Scenario: Stored cascade
- **WHEN** entity A, linked to B, is deleted and the page is reloaded
- **THEN** no relation referencing A remains

#### Scenario: Screenshot deleted with its source
- **WHEN** a source with a screenshot is deleted, the save completes, and the user leaves the investigation
- **THEN** no screenshot of that source remains in storage

## ADDED Requirements

### Requirement: Purge of unreferenced screenshots
A screenshot released by deleting its source, or by replacing or removing it, SHALL stay in
storage while the investigation is open, so that undoing can restore it. Screenshots referenced by
no source SHALL be deleted from storage when the user leaves the investigation, and when the
investigation is opened.

#### Scenario: Screenshot kept while open
- **WHEN** a source with a screenshot is deleted, the save completes, and the user undoes
- **THEN** the screenshot is displayed again without any error

#### Scenario: Screenshot purged on open
- **WHEN** storage holds a screenshot of investigation I referenced by no source, and I is opened
- **THEN** that screenshot is deleted from storage and the screenshots of I's sources are kept
