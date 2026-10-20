# Spec Delta

## MODIFIED Requirements

### Requirement: Filters panel
The graph view toolbar SHALL show a "Filtres" button opening a panel with five criteria: "Type",
"Tag", "Statut des entités", "Statut des relations" and "Confiance". A criterion with nothing
chosen SHALL not constrain the graph. On narrow screens (see responsive-layout) the panel SHALL be
opened from the "Filtres" entry of the "Plus d’actions" menu, in a dialog titled "Filtres".

#### Scenario: Open the panel
- **WHEN** the user clicks "Filtres"
- **THEN** a panel shows the criteria "Type", "Tag", "Statut des entités", "Statut des relations" and "Confiance", none of them active

#### Scenario: Open the panel on a narrow screen
- **WHEN** an investigation is opened in a 412 px wide viewport and the user taps "Plus d’actions" then "Filtres"
- **THEN** a "Filtres" dialog shows the five criteria, and checking a type dims the other entities once the dialog is closed
