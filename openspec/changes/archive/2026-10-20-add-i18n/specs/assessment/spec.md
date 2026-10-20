# Spec Delta

## MODIFIED Requirements

### Requirement: Admiralty confidence scale
A confidence grade SHALL combine a source reliability from A to F and an information credibility
from 1 to 6, written as the letter followed by the digit (e.g. "B2"). Each value SHALL have the
meaning listed in the scenarios below, in the active language.

#### Scenario: Reliability labels
- **WHEN** the user opens the reliability selector
- **THEN** it offers "A — Totalement fiable", "B — Habituellement fiable", "C — Assez fiable", "D — Pas toujours fiable", "E — Peu fiable" and "F — Fiabilité indéterminée", in that order

#### Scenario: Credibility labels
- **WHEN** the user opens the credibility selector
- **THEN** it offers "1 — Confirmée", "2 — Probablement vraie", "3 — Possiblement vraie", "4 — Douteuse", "5 — Improbable" and "6 — Véracité indéterminée", in that order

#### Scenario: Reliability labels in English
- **WHEN** the interface is in English and the user opens the reliability selector
- **THEN** it offers "A — Completely reliable", "B — Usually reliable", "C — Fairly reliable", "D — Not usually reliable", "E — Unreliable" and "F — Reliability cannot be judged", in that order

#### Scenario: Credibility labels in English
- **WHEN** the interface is in English and the user opens the credibility selector
- **THEN** it offers "1 — Confirmed by other sources", "2 — Probably true", "3 — Possibly true", "4 — Doubtful", "5 — Improbable" and "6 — Truth cannot be judged", in that order

#### Scenario: Out-of-scale grade rejected
- **WHEN** an imported file contains an entity whose confidence reliability is "G" or credibility is 7
- **THEN** the import is rejected and nothing is stored

## ADDED Requirements

### Requirement: Assessment vocabulary in English
In English, the assessment texts SHALL use the NATO (AJP-2.1) Admiralty terminology: the
"Hypothèse" switch reads "Hypothesis", the selectors read "Source reliability" and "Information
credibility", an ungraded element shows "Not rated", and the grade summary reads "Rating: <grade>".

#### Scenario: Grade an entity in English
- **WHEN** the interface is in English, an ungraded entity is selected and the user picks "B — Usually reliable" then "2 — Probably true"
- **THEN** the panel shows "Rating: B2"

#### Scenario: Ungraded element in English
- **WHEN** the interface is in English and an ungraded relation is selected
- **THEN** the "Source reliability" and "Information credibility" selectors both show "Not rated", and a "Hypothesis" switch is shown
