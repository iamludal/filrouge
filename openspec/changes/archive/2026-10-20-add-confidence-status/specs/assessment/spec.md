# Spec Delta

## Purpose

Lets the user state how certain each entity and relation is: whether it is verified or still a
hypothesis, and how reliable its source and credible its information are on the Admiralty scale.

## ADDED Requirements

### Requirement: Status of an element
Every entity and every relation SHALL have a status, either "verified" or "hypothesis". The
detail panel of the selected entity or relation SHALL show a "Hypothèse" switch, on when the
status is "hypothesis", and toggling it SHALL change the status immediately.

#### Scenario: Mark an entity as verified
- **WHEN** a hypothetical entity is selected and the user turns off "Hypothèse"
- **THEN** the entity's status becomes "verified" and its node no longer shows the hypothesis border

#### Scenario: Mark a relation as hypothesis
- **WHEN** a verified relation is selected and the user turns on "Hypothèse"
- **THEN** the relation's status becomes "hypothesis" and its link is drawn dashed

### Requirement: Admiralty confidence scale
A confidence grade SHALL combine a source reliability from A to F and an information credibility
from 1 to 6, written as the letter followed by the digit (e.g. "B2"). Each value SHALL have the
French meaning listed in the scenarios below.

#### Scenario: Reliability labels
- **WHEN** the user opens the reliability selector
- **THEN** it offers "A — Totalement fiable", "B — Habituellement fiable", "C — Assez fiable", "D — Pas toujours fiable", "E — Peu fiable" and "F — Fiabilité indéterminée", in that order

#### Scenario: Credibility labels
- **WHEN** the user opens the credibility selector
- **THEN** it offers "1 — Confirmée", "2 — Probablement vraie", "3 — Possiblement vraie", "4 — Douteuse", "5 — Improbable" and "6 — Véracité indéterminée", in that order

#### Scenario: Out-of-scale grade rejected
- **WHEN** an imported file contains an entity whose confidence reliability is "G" or credibility is 7
- **THEN** the import is rejected and nothing is stored

### Requirement: Edit the confidence grade
The detail panel SHALL show a "Fiabilité de la source" selector and a "Crédibilité de
l’information" selector. An ungraded element SHALL show both as "Non évaluée". Picking a value
SHALL grade the element immediately.

#### Scenario: Grade an entity
- **WHEN** an ungraded entity is selected and the user picks "B — Habituellement fiable" then "2 — Probablement vraie"
- **THEN** the entity's confidence is reliability "B", credibility 2, and the panel shows "Cotation : B2"

#### Scenario: Change one half of a grade
- **WHEN** a relation graded "B2" is selected and the user picks "4 — Douteuse"
- **THEN** the relation's grade becomes "B4"

### Requirement: Grade is always complete
A grade SHALL never be half set. Picking a reliability on an ungraded element SHALL set its
credibility to 6, and picking a credibility on an ungraded element SHALL set its reliability to F.

#### Scenario: Only the reliability is known
- **WHEN** an ungraded entity is selected and the user picks only "A — Totalement fiable"
- **THEN** the entity's grade is "A6" and the credibility selector shows "6 — Véracité indéterminée"

#### Scenario: Only the credibility is known
- **WHEN** an ungraded relation is selected and the user picks only "1 — Confirmée"
- **THEN** the relation's grade is "F1"

### Requirement: Clear the confidence grade
A graded element SHALL offer an "Effacer la cotation" button that removes the grade entirely. An
ungraded element SHALL NOT show this button.

#### Scenario: Clear a grade
- **WHEN** an entity graded "C3" is selected and the user clicks "Effacer la cotation"
- **THEN** the entity has no confidence, both selectors show "Non évaluée" and its node shows no badge

#### Scenario: Nothing to clear
- **WHEN** an ungraded entity is selected
- **THEN** no "Effacer la cotation" button is shown

### Requirement: Status and grade are independent
The status and the confidence grade SHALL be set independently: any grade, or no grade, SHALL be
allowed with either status.

#### Scenario: Graded hypothesis
- **WHEN** the user grades a hypothetical relation "E5"
- **THEN** the relation stays a hypothesis and its grade is "E5"

### Requirement: Status and grade are persisted and exported
Status and confidence changes SHALL be saved automatically like other edits, and SHALL be kept
unchanged by export followed by import.

#### Scenario: Survives a reload
- **WHEN** the user marks an entity verified, grades it "B2" and reloads the page
- **THEN** the entity is still verified and graded "B2"

#### Scenario: Survives export and re-import
- **WHEN** an investigation with a verified entity graded "A1", a hypothetical relation graded "D4" and an ungraded hypothetical entity is exported, deleted and re-imported
- **THEN** each element has the same status and grade as before, and the ungraded entity has no confidence

### Requirement: Existing elements keep their status
Elements created before this change SHALL keep their stored status. Opening or importing them
SHALL NOT change their status or confidence.

#### Scenario: Investigation from v0.1
- **WHEN** an investigation exported by v0.1, where every element is "verified" and ungraded, is imported
- **THEN** every element is shown verified, with no badge and no dashed line
