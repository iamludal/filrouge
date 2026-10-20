# graph-filters Specification

## Purpose

Lets the user narrow the graph of the open investigation to the entities and relations of given
types, tags, statuses and confidence grades, by dimming everything else.

## Requirements

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

### Requirement: Type criterion
The "Type" criterion SHALL list, as checkboxes, the entity types used in the investigation, each
with its icon and the number of entities of that type. Checking types SHALL keep only entities of
one of the checked types.

#### Scenario: Types listed
- **WHEN** the investigation has 3 "Personne" and 2 "Email" entities and the panel is opened
- **THEN** the "Type" criterion lists "Personne (3)" and "Email (2)" and no other type

#### Scenario: Filter by type
- **WHEN** the user checks "Email"
- **THEN** the two Email entities are shown normally and the three Personne entities are dimmed

### Requirement: Tag criterion
The "Tag" criterion SHALL list, as checkboxes sorted alphabetically, the tags used in the
investigation, tags differing only by case counted as one. Checking tags SHALL keep only entities
carrying at least one of the checked tags, compared ignoring case. When no entity has a tag, the
criterion SHALL read "Aucun tag dans cette enquête".

#### Scenario: Filter by tag
- **WHEN** entity A has the tag "Cible", entity B the tag "cible", entity C no tag, and the user checks "Cible"
- **THEN** A and B are shown normally and C is dimmed

#### Scenario: No tag at all
- **WHEN** no entity of the investigation has a tag and the panel is opened
- **THEN** the "Tag" criterion reads "Aucun tag dans cette enquête"

### Requirement: Status criteria
"Statut des entités" and "Statut des relations" SHALL each be a three-way choice "Tous",
"Vérifiés", "Hypothèses", set to "Tous" by default. "Statut des entités" SHALL apply to entities
only and "Statut des relations" to relations only; "Vérifiés" or "Hypothèses" keeps only the
elements with that status.

#### Scenario: Only verified relations
- **WHEN** the user sets "Statut des relations" to "Vérifiés" and leaves "Statut des entités" on "Tous"
- **THEN** hypothetical relations are dimmed, verified relations are shown normally and no entity is dimmed

#### Scenario: Only hypothetical entities
- **WHEN** the user sets "Statut des entités" to "Hypothèses"
- **THEN** verified entities are dimmed, along with the relations attached to them

#### Scenario: Back to all
- **WHEN** "Statut des relations" is on "Vérifiés" and the user sets it back to "Tous"
- **THEN** no relation is dimmed by status and the criterion is no longer active

### Requirement: Confidence criterion
The "Confiance" criterion SHALL offer a minimum reliability ("Fiabilité au moins", A to E or
"Toutes"), a minimum credibility ("Crédibilité au moins", 1 to 5 or "Toutes") and an "Inclure
les éléments non cotés" checkbox, checked by default. A grade passes when its reliability is
the chosen letter or better (A best) and its credibility the chosen number or better (1 best).
Ungraded entities and relations pass only when the checkbox is checked.

#### Scenario: Minimum reliability
- **WHEN** the user sets "Fiabilité au moins" to "B"
- **THEN** elements graded A1 and B3 are shown normally, an element graded C1 is dimmed, ungraded elements are shown normally

#### Scenario: Both thresholds
- **WHEN** the user sets "Fiabilité au moins" to "B" and "Crédibilité au moins" to "2"
- **THEN** an element graded B2 is shown normally and an element graded B3 is dimmed

#### Scenario: Exclude ungraded elements
- **WHEN** the user unchecks "Inclure les éléments non cotés"
- **THEN** every ungraded entity and relation is dimmed

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

### Requirement: Combining criteria
Within a criterion, checked values SHALL be alternatives; an element SHALL pass the filters only
when it passes every active criterion.

#### Scenario: Two types and a status
- **WHEN** the user checks the types "Email" and "Domaine" and sets "Statut des entités" to "Vérifiés"
- **THEN** only verified Email and verified Domaine entities are shown normally among the entities

### Requirement: Filters on relations
Type, tag and entity status criteria SHALL apply to entities only; the relation status criterion
SHALL apply to relations only; the confidence criterion SHALL apply to both. A relation SHALL be
dimmed when it fails the relation status or confidence criterion or when one of its two entities
is dimmed.

#### Scenario: Relation to a filtered-out entity
- **WHEN** an Email entity is linked to a Personne entity and the user checks only the type "Email"
- **THEN** the Personne entity and the link between them are dimmed

#### Scenario: Relation kept by a type filter
- **WHEN** two Email entities are linked by a verified relation and the user checks only the type "Email"
- **THEN** both entities and their link are shown normally

### Requirement: Filtered elements are dimmed, not hidden
Elements that do not pass the filters SHALL be dimmed but stay at their place, selectable and
editable. When every entity is dimmed by the filters, the canvas SHALL read "Aucun élément ne
correspond aux filtres."

#### Scenario: Dimmed entity still editable
- **WHEN** an entity is dimmed by a filter and the user clicks it
- **THEN** it is selected and its editor is shown in the detail panel

#### Scenario: Nothing matches
- **WHEN** the user checks the type "Email" and sets "Fiabilité au moins" to "A" while no Email entity is graded A
- **THEN** every entity is dimmed and the canvas reads "Aucun élément ne correspond aux filtres."

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

### Requirement: Filters and search combined
Search results SHALL be taken among the elements that pass the filters. An element SHALL be
highlighted only when it passes the filters and matches the search, and dimmed when it fails
either.

#### Scenario: Result outside the filters
- **WHEN** entities "Alice" (Personne) and "alice@example.org" (Email) exist, the user checks only the type "Email" and searches "alice"
- **THEN** the counter reads "1 résultat", "alice@example.org" is highlighted and "Alice" is dimmed

### Requirement: Search and filters are view state only
Search and filters SHALL not modify the investigation: they SHALL not be saved, SHALL not be part
of the undo history, SHALL not appear in JSON, PNG or SVG exports, and SHALL be reset when an
investigation is opened.

#### Scenario: Reset on opening
- **WHEN** filters and a search are active, the user goes back to the investigations list and opens the investigation again
- **THEN** the search field is empty, no criterion is active and no element is dimmed

#### Scenario: Not undoable
- **WHEN** the user renames an entity, checks a type filter, closes the filters panel and presses Cmd/Ctrl+Z
- **THEN** the rename is undone and the type filter stays checked

#### Scenario: Image export unaffected
- **WHEN** a filter dims some entities and the user exports the graph as SVG
- **THEN** the SVG draws every entity and relation as without filters
