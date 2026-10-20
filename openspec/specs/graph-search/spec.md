# graph-search Specification

## Purpose

Lets the user find entities and relations of the open investigation by their text, see them
highlighted on the graph, and move from one result to the next.

## Requirements

### Requirement: Search field
The graph view toolbar SHALL show a search field labelled "Rechercher dans le graphe" with the
placeholder "Rechercher…". A blank query (empty or only spaces) SHALL mean no search: the graph is
shown as without search.

#### Scenario: Field in the toolbar
- **WHEN** an investigation is open
- **THEN** the toolbar shows an empty "Rechercher dans le graphe" field

#### Scenario: Blank query
- **WHEN** the user types only spaces in the field
- **THEN** no element is highlighted or dimmed and no counter is shown

### Requirement: Searched fields
The search SHALL look in each entity's label, property keys, property values (text, number or
boolean written as text), notes and tags, and in each relation's label. Nothing else SHALL be
searched (in particular not the type name, sources or grades).

#### Scenario: Match in a property value
- **WHEN** an entity labelled "Jean" has the property "email" = "jdupont@example.org" and the user searches "jdupont"
- **THEN** that entity is a result

#### Scenario: Match in a property key
- **WHEN** an entity has the property "plateforme" and the user searches "plateforme"
- **THEN** that entity is a result

#### Scenario: Match in notes
- **WHEN** an entity's notes contain "vu à Lyon en 2021" and the user searches "lyon"
- **THEN** that entity is a result

#### Scenario: Match in a tag
- **WHEN** an entity has the tag "suspect" and the user searches "susp"
- **THEN** that entity is a result

#### Scenario: Match in a relation label
- **WHEN** a relation is labelled "travaille pour" and the user searches "travaille"
- **THEN** that relation is a result

#### Scenario: Type name not searched
- **WHEN** an unlabelled entity of type "Personne" has no other text and the user searches "personne"
- **THEN** that entity is not a result

### Requirement: Matching rules
Matching SHALL ignore case and accents and find the query anywhere inside a field. A query of
several words separated by spaces SHALL match an element when each word is found in at least one
of its searched fields.

#### Scenario: Case and accents ignored
- **WHEN** an entity is labelled "Société Générale" and the user searches "societe GENERALE"
- **THEN** that entity is a result

#### Scenario: Words in different fields
- **WHEN** an entity labelled "Dupont" has the tag "cible" and the user searches "dupont cible"
- **THEN** that entity is a result

#### Scenario: One word missing
- **WHEN** an entity labelled "Dupont" has no field containing "martin" and the user searches "dupont martin"
- **THEN** that entity is not a result

### Requirement: Results highlighted, others dimmed
While a search is active, each result SHALL be visibly highlighted and every other entity and
relation SHALL be dimmed. Dimmed elements SHALL stay at their place, selectable and editable.
Results SHALL follow edits: an element that starts or stops matching after an edit is updated at
once.

#### Scenario: Highlight and dim
- **WHEN** the graph has entities "Alice" and "Bob" linked by "connaît" and the user searches "alice"
- **THEN** "Alice" is highlighted, "Bob" and the link "connaît" are dimmed

#### Scenario: Dimmed element still editable
- **WHEN** "Bob" is dimmed by a search and the user clicks it
- **THEN** "Bob" is selected and its editor is shown in the detail panel

#### Scenario: Edit makes an element match
- **WHEN** "Bob" is dimmed by the search "alice" and the user renames it "Alice B."
- **THEN** "Alice B." becomes a highlighted result

### Requirement: Result counter
While a search is active, the field SHALL show the number of results: "Aucun résultat", "1
résultat" or "<n> résultats". Once the user has moved to a result, it SHALL read "<k> / <n>",
where k is the position of the current result. Changing the query SHALL reset the current
result.

#### Scenario: Count before navigating
- **WHEN** the user's query matches three elements
- **THEN** the counter reads "3 résultats"

#### Scenario: No result
- **WHEN** the user's query matches nothing
- **THEN** the counter reads "Aucun résultat" and every element is dimmed

#### Scenario: Position after navigating
- **WHEN** the query matches three elements and the user presses Enter once
- **THEN** the counter reads "1 / 3"

### Requirement: Navigate between results
Enter in the search field or the "Résultat suivant" button SHALL move to the next result; Shift+
Enter or the "Résultat précédent" button SHALL move to the previous one, wrapping around at both
ends. Moving to a result SHALL select it and centre the view on it without changing the zoom.
Results SHALL be ordered by their place on the graph, top to bottom then left to right (a
relation is placed at the middle of its two entities).

#### Scenario: Next result
- **WHEN** results "A" (top) and "B" (below it) exist and the user presses Enter twice
- **THEN** "B" is selected, the view is centred on it, and its editor is shown in the detail panel

#### Scenario: Wrap around
- **WHEN** the current result is the last one and the user presses Enter
- **THEN** the first result becomes current and the counter reads "1 / <n>"

#### Scenario: Previous from the start
- **WHEN** the user presses Shift+Enter right after typing a query with three results
- **THEN** the last result is selected and the counter reads "3 / 3"

#### Scenario: Navigate to a relation
- **WHEN** the current result is a relation
- **THEN** that relation is selected and the view is centred on the middle of its link

### Requirement: Keyboard access
Cmd+F (macOS) or Ctrl+F (other systems) SHALL focus the search field and select its text instead
of opening the browser's find bar, except while a dialog is open. Escape in the field SHALL clear
the query.

#### Scenario: Focus with the shortcut
- **WHEN** the graph view is shown and the user presses Ctrl+F
- **THEN** the search field has the focus with its text selected

#### Scenario: Shortcut with a dialog open
- **WHEN** the "Nouvelle entité" dialog is open and the user presses Ctrl+F
- **THEN** the search field does not take the focus

#### Scenario: Clear with Escape
- **WHEN** the search field contains "alice" and the user presses Escape
- **THEN** the field is empty and no element is highlighted or dimmed

### Requirement: Clear the search
When the query is not empty, the field SHALL show a "Effacer la recherche" button that empties
it.

#### Scenario: Clear button
- **WHEN** the user clicks "Effacer la recherche"
- **THEN** the field is empty and the graph is shown without highlighting or dimming
