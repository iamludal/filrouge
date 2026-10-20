# responsive-layout Specification

## Purpose
Defines how the application adapts to narrow and touch screens, from 360 px wide phones up, so that
every action of the graph view stays reachable without a mouse or a physical keyboard.

## Requirements

### Requirement: Narrow screens
A viewport narrower than 768 CSS pixels SHALL be a narrow screen. The narrow-screen layout SHALL
apply below that width only, and SHALL follow the viewport when it is resized or rotated, without
losing the selection, the search or the filters.

#### Scenario: Phone
- **WHEN** an investigation is opened in a 412 px wide viewport
- **THEN** the graph view uses the narrow-screen layout

#### Scenario: Tablet in portrait
- **WHEN** an investigation is opened in a 768 px wide viewport
- **THEN** the detail panel is docked on the right as on a desktop

#### Scenario: Rotate with a selection
- **WHEN** entity A is selected in a 412 px wide viewport and the viewport becomes 915 px wide
- **THEN** A is still selected and its editor is shown in the side panel

### Requirement: No horizontal scrolling
From a 360 px wide viewport up, neither the home screen nor the graph view SHALL scroll
horizontally, and the content SHALL not overflow the viewport width.

#### Scenario: Home screen at 360 px
- **WHEN** the home screen with three investigations is shown in a 360 px wide viewport
- **THEN** the page's scroll width equals the viewport width

#### Scenario: Graph view at 360 px
- **WHEN** an investigation with a long name is opened in a 360 px wide viewport
- **THEN** the page's scroll width equals the viewport width and the name is truncated

### Requirement: Compact graph toolbar
On narrow screens, the graph toolbar SHALL show only the "Retour aux enquêtes" link, the
investigation name, the save status as an icon, a "Rechercher dans le graphe" button, an "Annuler"
button and a "Plus d’actions" menu button. The menu SHALL hold "Rétablir", "Filtres", "Sources" and
the export formats "JSON", "PNG" and "SVG".

#### Scenario: Toolbar on a phone
- **WHEN** an investigation is opened in a 412 px wide viewport
- **THEN** the toolbar shows the name, "Rechercher dans le graphe", "Annuler" and "Plus d’actions", and no "Filtres", "Sources" or "Exporter" button

#### Scenario: Overflow menu
- **WHEN** the user taps "Plus d’actions"
- **THEN** a menu lists "Rétablir", "Filtres", "Sources", "JSON", "PNG" and "SVG"

#### Scenario: Export from the menu
- **WHEN** the user taps "Plus d’actions" then "SVG"
- **THEN** an SVG file of the graph is downloaded

#### Scenario: Save status as an icon
- **WHEN** an edit is being saved on a narrow screen
- **THEN** the save status is shown as an icon whose accessible name is "Enregistrement…"

### Requirement: Active filters signalled on the menu button
On narrow screens, the "Plus d’actions" button SHALL show a dot while at least one filter criterion
is active, and the "Filtres" menu entry SHALL show the number of active criteria.

#### Scenario: One filter active
- **WHEN** the type "Email" is checked in the filters on a narrow screen
- **THEN** the "Plus d’actions" button shows a dot and the "Filtres" menu entry shows "1"

### Requirement: Detail drawer
On narrow screens the detail panel SHALL be a drawer anchored to the bottom of the screen instead
of a side panel. It SHALL be hidden while nothing is selected and appear collapsed when a
selection is made. It SHALL never block the canvas above it.

#### Scenario: Nothing selected
- **WHEN** an investigation is opened on a narrow screen and nothing is selected
- **THEN** no detail drawer is shown and the canvas fills the space below the toolbar

#### Scenario: Select an entity
- **WHEN** the user taps entity "Jean" of type "Personne" on a narrow screen
- **THEN** a collapsed drawer labelled "Panneau de détail" shows "Personne" and "Jean" at the bottom, and the editor fields are not shown

#### Scenario: Canvas usable with the drawer collapsed
- **WHEN** entity A is selected on a narrow screen and the user taps entity B above the drawer
- **THEN** B is selected and the drawer shows B

#### Scenario: Deselect
- **WHEN** entity A is selected on a narrow screen and the user taps an empty area of the canvas
- **THEN** the drawer is hidden

### Requirement: Collapsed drawer summary
The collapsed drawer SHALL summarise the selection in one line: the entity's type and label (or
"<type label> sans nom"), the relation's label with its two ends, or "N éléments sélectionnés" for
a multiple selection.

#### Scenario: Relation selected
- **WHEN** the relation "connaît" from "Jean" to "Marie" is selected on a narrow screen
- **THEN** the collapsed drawer reads "connaît" and "Jean → Marie"

#### Scenario: Multiple selection
- **WHEN** two entities and one relation are selected on a narrow screen
- **THEN** the collapsed drawer reads "3 éléments sélectionnés"

### Requirement: Expand and collapse the drawer
The drawer's handle SHALL be a button named "Déplier le panneau" when collapsed and "Replier le
panneau" when expanded, exposing its state to assistive technologies. Tapping it or dragging it up
SHALL expand the drawer to show the full editor; tapping it or dragging it down SHALL collapse it.

#### Scenario: Expand by tapping
- **WHEN** an entity is selected on a narrow screen and the user taps "Déplier le panneau"
- **THEN** the drawer shows the entity's label, properties, tags, notes and sources editors

#### Scenario: Expand by dragging
- **WHEN** the user drags the collapsed drawer's handle upwards by more than 80 px and releases it
- **THEN** the drawer is expanded

#### Scenario: Collapse by dragging
- **WHEN** the drawer is expanded and the user drags its handle downwards by more than 80 px
- **THEN** the drawer is collapsed and the selection is kept

#### Scenario: Short drag
- **WHEN** the user drags the collapsed drawer's handle upwards by 20 px and releases it
- **THEN** the drawer stays collapsed

#### Scenario: Expanded height
- **WHEN** the drawer is expanded on a 915 px tall viewport
- **THEN** the drawer is at most 85 % of the viewport height and its content scrolls inside it

### Requirement: Close the drawer
The drawer SHALL offer a "Fermer" button that clears the selection, which hides the drawer.
Dragging the collapsed drawer's handle down by more than 80 px SHALL do the same. A new selection
SHALL show the drawer collapsed again.

#### Scenario: Close button
- **WHEN** the drawer of entity A is expanded and the user taps "Fermer"
- **THEN** nothing is selected and the drawer is hidden

#### Scenario: Swipe down from collapsed
- **WHEN** the drawer is collapsed and the user drags its handle downwards by more than 80 px
- **THEN** nothing is selected and the drawer is hidden

#### Scenario: Next selection starts collapsed
- **WHEN** the drawer was expanded, closed, and the user then taps entity B
- **THEN** the drawer shows B collapsed

### Requirement: Drawer keeps the selection's editor
While the drawer is expanded, selecting another element SHALL keep it expanded and show the new
element's editor. Edits made in the drawer SHALL be saved and undoable like edits in the side panel.

#### Scenario: Switch element while expanded
- **WHEN** the drawer of entity A is expanded and A's relation to B is tapped on the visible canvas
- **THEN** the drawer stays expanded and shows the relation's editor

#### Scenario: Edit in the drawer
- **WHEN** the user renames entity A to "Alpha" in the expanded drawer and reloads the page
- **THEN** the entity's node reads "Alpha"

### Requirement: Touch target size
On narrow screens, every button of the graph toolbar and of the drawer's bar (handle, "Fermer")
SHALL be at least 44 × 44 CSS pixels.

#### Scenario: Toolbar buttons
- **WHEN** an investigation is opened in a 412 px wide viewport
- **THEN** "Retour aux enquêtes", "Rechercher dans le graphe", "Annuler" and "Plus d’actions" each measure at least 44 × 44 px

### Requirement: Dialogs fit the viewport
Every dialog SHALL fit within the viewport width from 360 px up, leaving a margin on each side,
and SHALL scroll its content when it is taller than the viewport, keeping its actions reachable.

#### Scenario: Source form on a phone
- **WHEN** the "Nouvelle source" dialog is opened in a 360 × 640 px viewport
- **THEN** the dialog is narrower than the viewport and its "Enregistrer" button can be reached by scrolling the dialog
