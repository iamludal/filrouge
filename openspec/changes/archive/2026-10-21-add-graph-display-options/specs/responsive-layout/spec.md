# Spec Delta

## MODIFIED Requirements

### Requirement: Compact graph toolbar
On narrow screens, the graph toolbar SHALL show only the "Retour aux enquêtes" link, the
investigation name, the save status as an icon, a "Rechercher dans le graphe" button, an "Annuler"
button and a "Plus d'actions" menu button. The menu SHALL hold "Rétablir", "Filtres", "Affichage",
"Sources" and the export formats "JSON", "PNG" and "SVG". "Affichage" SHALL open a submenu with the
display options of graph-display-options. There is no mini-map button on narrow screens, where
the mini-map is never shown.

#### Scenario: Toolbar on a phone
- **WHEN** an investigation is opened in a 412 px wide viewport
- **THEN** the toolbar shows the name, "Rechercher dans le graphe", "Annuler" and "Plus d'actions", and no "Filtres", "Affichage", "Sources" or "Exporter" button

#### Scenario: Overflow menu
- **WHEN** the user taps "Plus d'actions"
- **THEN** a menu lists "Rétablir", "Filtres", "Affichage", "Sources", "JSON", "PNG" and "SVG"

#### Scenario: Export from the menu
- **WHEN** the user taps "Plus d'actions" then "SVG"
- **THEN** an SVG file of the graph is downloaded

#### Scenario: Save status as an icon
- **WHEN** an edit is being saved on a narrow screen
- **THEN** the save status is shown as an icon whose accessible name is "Enregistrement…"

#### Scenario: Display submenu
- **WHEN** the user taps "Plus d'actions" then "Affichage"
- **THEN** a submenu lists "Libellés des entités", "Libellés des relations", "Cotations" and "Marque « Important »", then "Réinitialiser l'affichage"

#### Scenario: Toggle from the submenu
- **WHEN** the user taps "Plus d'actions", "Affichage", then "Libellés des entités"
- **THEN** the entity labels disappear from the canvas

## ADDED Requirements

### Requirement: Changed display signalled on the menu button
On narrow screens, the "Plus d'actions" button SHALL show its dot while at least one display option
is unchecked, as it does for active filters.

#### Scenario: Display option unchecked
- **WHEN** "Cotations" is unchecked on a narrow screen and no filter is active
- **THEN** the "Plus d'actions" button shows a dot

#### Scenario: Mini-map hidden on the device
- **WHEN** the mini-map was hidden on a wide screen, no filter is active, and the investigation is opened in a 412 px wide viewport
- **THEN** the "Plus d'actions" button shows no dot
