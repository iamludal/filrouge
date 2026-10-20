# Spec Delta

## MODIFIED Requirements

### Requirement: Filters panel
The graph view toolbar SHALL show a "Filtres" button opening a panel with six criteria: "Type",
"Tag", "Statut des entités", "Statut des relations", "Confiance" and "Importance". A criterion with
nothing chosen SHALL not constrain the graph. On narrow screens (see responsive-layout) the panel
SHALL be opened from the "Filtres" entry of the "Plus d'actions" menu, in a dialog titled
"Filtres".

#### Scenario: Open the panel
- **WHEN** the user clicks "Filtres"
- **THEN** a panel shows the criteria "Type", "Tag", "Statut des entités", "Statut des relations", "Confiance" and "Importance", none of them active

#### Scenario: Open the panel on a narrow screen
- **WHEN** an investigation is opened in a 412 px wide viewport and the user taps "Plus d'actions" then "Filtres"
- **THEN** a "Filtres" dialog shows the six criteria, and checking a type dims the other entities once the dialog is closed

### Requirement: Active filters indicator and reset
The "Filtres" button SHALL show the number of active criteria (from 1 to 6) when there is at
least one. The panel SHALL offer a "Réinitialiser" button that clears every criterion, disabled
when none is active.

#### Scenario: Count of active criteria
- **WHEN** the user checks two types and sets "Statut des relations" to "Vérifiés"
- **THEN** the "Filtres" button shows "2"

#### Scenario: Reset
- **WHEN** filters are active and the user clicks "Réinitialiser"
- **THEN** no criterion is active, the button shows no count and no element is dimmed

#### Scenario: Importance counted
- **WHEN** the user checks one type and "Entités importantes uniquement"
- **THEN** the "Filtres" button shows "2"

## ADDED Requirements

### Requirement: Importance criterion
The "Importance" criterion SHALL be a single checkbox, "Entités importantes uniquement", followed
by the number of important entities. Checking it SHALL keep only entities marked important (see
entity-appearance); relations follow their entities as for the other entity criteria.

#### Scenario: Filter by importance
- **WHEN** the investigation has 5 entities, 2 of them important, and the user checks "Entités importantes uniquement"
- **THEN** the 2 important entities are shown normally and the 3 others are dimmed

#### Scenario: Count shown
- **WHEN** 2 entities are important and the panel is opened
- **THEN** the "Importance" criterion reads "Entités importantes uniquement (2)"

#### Scenario: Relation between important and unmarked entities
- **WHEN** relation R links important entity A to unmarked entity B and the criterion is checked
- **THEN** A is shown normally, B and R are dimmed

#### Scenario: Combined with a type
- **WHEN** the user checks the type "Email" and "Entités importantes uniquement"
- **THEN** only important Email entities are shown normally
