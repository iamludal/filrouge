# Spec Delta

## MODIFIED Requirements

### Requirement: Icon set
The application SHALL offer a fixed set of 95 icons, each with a stable id and a name in the
active language: the 14 entity type icons plus 81 others (e.g. a group of people, a mask, a skull,
an identity card, a factory, a truck, a drone, a satellite, a bitcoin, a lock, a bank, a gavel). Every icon SHALL be shipped
with the application. No other icon, and no user image, SHALL be selectable.

#### Scenario: Icon set offered
- **WHEN** the user opens the icon picker of the selected entity
- **THEN** 95 icons are offered, each with an accessible name (e.g. "Crâne"), plus an "Icône du type" choice

#### Scenario: No network request
- **WHEN** the user opens the icon picker and picks an icon
- **THEN** the application makes no network request
