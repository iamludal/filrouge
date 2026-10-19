# Spec Delta

## Purpose

Lets the user record the evidence behind an investigation as sources, kept in a per-investigation
library and attached to the entities and relations they support.

## ADDED Requirements

### Requirement: Source fields
A source SHALL have an optional title (up to 500 characters), an optional URL, an optional archive
link, a capture date, an optional note (up to 100,000 characters) and an optional screenshot. URL
and archive link SHALL be `http` or `https` and at most 2,048 characters.

#### Scenario: Invalid URL
- **WHEN** the user types `javascript:alert(1)` as the source URL and saves
- **THEN** the form shows "URL invalide (http ou https)" and the source is not saved

#### Scenario: Archive link
- **WHEN** the user saves a source with archive link `https://web.archive.org/web/2026/https://exemple.fr`
- **THEN** the source shows that archive link as a link opening in a new tab without referrer

### Requirement: Non-empty source
A source SHALL have at least a title, a URL or a screenshot; the form SHALL refuse to save a source
with none of them.

#### Scenario: Empty source
- **WHEN** the user opens "Nouvelle source" and clicks "Enregistrer" without filling anything
- **THEN** "Renseignez au moins un titre, une URL ou une capture" is shown and nothing is created

### Requirement: Capture date
The capture date SHALL default to the current date and time when a source is created, SHALL be
editable to the minute in the user's local time zone, and SHALL be stored in UTC.

#### Scenario: Default capture date
- **WHEN** the user opens "Nouvelle source"
- **THEN** the capture date field shows the current local date and time

#### Scenario: Edited capture date
- **WHEN** the user sets the capture date to 3 March 2026 at 14:05 and saves
- **THEN** the source shows that date and time after a page reload

### Requirement: Source display name
Wherever a source is listed, it SHALL be shown by its title, or else by its URL's host name, or
else as "Source sans titre", with an indicator when it holds a screenshot.

#### Scenario: Source without title
- **WHEN** a source has no title and the URL `https://exemple.fr/page`
- **THEN** it is listed as "exemple.fr"

### Requirement: Create a source from an element
The entity and relation panels SHALL show a "Sources" section listing the sources attached to the
selected element. "Ajouter une source" then "Nouvelle source" SHALL open the source form; saving it
SHALL add the source to the investigation and attach it to the element.

#### Scenario: New source on an entity
- **WHEN** the user selects entity A, chooses "Ajouter une source" then "Nouvelle source", types the title "Profil LinkedIn" and saves
- **THEN** "Profil LinkedIn" is listed in A's "Sources" section and in the investigation's sources

#### Scenario: New source on a relation
- **WHEN** the user selects a relation and creates a source "Article de presse" from its panel
- **THEN** "Article de presse" is listed in the relation's "Sources" section

### Requirement: Attach an existing source
"Ajouter une source" then "Source existante" SHALL list the investigation's sources not yet
attached to the element, filterable by text, and attach the chosen one. One source SHALL be
attachable to any number of entities and relations.

#### Scenario: Reuse a source
- **WHEN** source S is attached to entity A, and the user attaches S to entity B through "Source existante"
- **THEN** S is listed for both A and B, and the investigation still contains a single source S

#### Scenario: Already attached sources are not offered
- **WHEN** the user opens "Source existante" on entity A, which already has source S
- **THEN** S is not offered in the list

### Requirement: Edit a source
Clicking a source, in an element's panel or in the source list, SHALL open its form; changes SHALL
be visible for every element the source is attached to.

#### Scenario: Shared edit
- **WHEN** source S is attached to A and B, and the user renames it from A's panel to "Capture Telegram"
- **THEN** B's "Sources" section lists "Capture Telegram"

### Requirement: Detach a source
Each source listed in an element's panel SHALL have a "Retirer" action that detaches it from that
element only. If no other element uses it, a confirmation SHALL offer "Supprimer aussi la source
et sa capture", unchecked by default.

#### Scenario: Detach a shared source
- **WHEN** source S is attached to A and B, and the user clicks "Retirer" on S in A's panel
- **THEN** S is no longer listed for A, is still listed for B, and no confirmation is shown

#### Scenario: Detach the last reference and keep the source
- **WHEN** S is attached only to A, the user clicks "Retirer" and confirms without checking the box
- **THEN** S is no longer listed for A and remains in the investigation's sources as unused

#### Scenario: Detach the last reference and delete the source
- **WHEN** S is attached only to A, the user clicks "Retirer", checks "Supprimer aussi la source et sa capture" and confirms
- **THEN** S and its screenshot are removed from the investigation

#### Scenario: Cancel detaching
- **WHEN** S is attached only to A, the user clicks "Retirer" then "Annuler"
- **THEN** S is still attached to A

### Requirement: Investigation source list
The graph view toolbar SHALL have a "Sources" button showing the number of sources and opening the
list of all sources of the investigation, each with its number of uses, or "Non utilisée" when no
element references it.

#### Scenario: Usage count
- **WHEN** source S is attached to two entities and one relation, and the user opens "Sources"
- **THEN** S is listed with "3 utilisations"

#### Scenario: Unused source
- **WHEN** a source is attached to no element
- **THEN** it is listed with "Non utilisée"

### Requirement: Delete a source
The source list SHALL allow deleting a source after confirmation. When the source is used, the
confirmation SHALL state the number of elements it will be detached from. Deleting SHALL remove
the source, its screenshot and every reference to it.

#### Scenario: Delete a used source
- **WHEN** source S is attached to A and B, and the user deletes it from the source list and confirms "Elle sera retirée de 2 éléments"
- **THEN** S disappears from the list and from the panels of A and B

### Requirement: Sources survive element deletion
Deleting an entity or a relation SHALL NOT delete the sources attached to it.

#### Scenario: Delete an entity with a source
- **WHEN** entity A, the only element using source S, is deleted
- **THEN** S remains in the source list as "Non utilisée"

### Requirement: Keyboard access to sources
Every source action (add, attach, open, detach, delete) SHALL be reachable and usable with the
keyboard alone.

#### Scenario: Attach with the keyboard
- **WHEN** the user tabs to "Ajouter une source", presses Enter, picks "Source existante", types part of a title and presses Enter on the result
- **THEN** the source is attached to the selected element
