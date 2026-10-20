# Spec Delta

## MODIFIED Requirements

### Requirement: Search field
The graph view toolbar SHALL show a search field labelled "Rechercher dans le graphe" with the
placeholder "Rechercher…". A blank query (empty or only spaces) SHALL mean no search: the graph is
shown as without search. On narrow screens (see responsive-layout) the toolbar SHALL show a
"Rechercher dans le graphe" button instead, which reveals the field across the whole toolbar with
the focus in it and a "Fermer la recherche" button; closing it clears the search.

#### Scenario: Field in the toolbar
- **WHEN** an investigation is open
- **THEN** the toolbar shows an empty "Rechercher dans le graphe" field

#### Scenario: Blank query
- **WHEN** the user types only spaces in the field
- **THEN** no element is highlighted or dimmed and no counter is shown

#### Scenario: Search on a narrow screen
- **WHEN** an investigation is opened in a 412 px wide viewport and the user taps "Rechercher dans le graphe"
- **THEN** the search field spans the toolbar, has the focus, and typing in it highlights the matching elements with the result counter shown

#### Scenario: Close the search on a narrow screen
- **WHEN** the search field is revealed with the query "jean" and the user taps "Fermer la recherche"
- **THEN** the compact toolbar is shown again and no element is highlighted or dimmed
