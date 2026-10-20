# entities Specification

## Purpose
Defines what an entity is (a typed piece of evidence such as a person, email or domain) and how
the user edits its details: type, label, properties, tags and Markdown notes.

## Requirements

### Requirement: Entity types
The application SHALL offer 14 entity types: person, alias, email, phone, domain, ip, url,
organization, address, image, document, crypto_wallet, vehicle, event. Each type SHALL have a
label and a list of suggested property names in the active language, an icon and a colour.

#### Scenario: Type list
- **WHEN** the user opens the type selector
- **THEN** the 14 types are offered with their French labels and icons

#### Scenario: Type list in English
- **WHEN** the interface is in English and the user opens the type selector
- **THEN** the 14 types are offered as "Person", "Alias / account", "Email", "Phone", "Domain", "IP address", "URL", "Organization", "Address", "Image", "Document", "Crypto wallet", "Vehicle" and "Event", with their icons

#### Scenario: Stored type independent of language
- **WHEN** the user creates a "Personne" entity, switches to English and exports the investigation
- **THEN** the entity's `type` is "person" and its node shows "Person"

#### Scenario: Unknown type rejected
- **WHEN** an entity with a type outside this list is imported or saved
- **THEN** it is rejected by validation

### Requirement: New entity defaults
A new entity SHALL start with no properties, no tags, no notes, no sources and the status
"verified".

#### Scenario: Freshly created entity
- **WHEN** the user adds an entity and exports the investigation
- **THEN** the entity has empty `properties`, `tags` and `sourceIds`, and `status` "verified"

### Requirement: Edit type and label
The detail panel SHALL let the user change the type and the label (up to 500 characters) of the
selected entity. Changes SHALL show on the node immediately.

#### Scenario: Change the label
- **WHEN** the user types "jean.dupont@example.org" in the label field
- **THEN** the node shows the new label

### Requirement: Free-form properties
The user SHALL be able to add, rename, edit and remove key/value properties (keys up to 100
characters, values up to 10,000, at most 200 properties). Suggested property names of the
entity type that are not yet present SHALL be offered as one-click additions.

#### Scenario: Add a suggested property
- **WHEN** an Email entity has no "fournisseur" property and the user clicks the "fournisseur" suggestion
- **THEN** an empty "fournisseur" property is added and the suggestion disappears

#### Scenario: Rename to an existing key
- **WHEN** the user renames a property to a key that already exists or to an empty key
- **THEN** the rename is cancelled and the original key is restored

### Requirement: Property value types
Property values SHALL be limited to text, number, boolean or empty (null). Nested objects or
arrays SHALL be rejected.

#### Scenario: Nested value in an import
- **WHEN** an imported entity has a property whose value is an object
- **THEN** the import is rejected

### Requirement: Tags
The user SHALL be able to add tags (Enter, comma, or leaving the field) and remove them. Tags SHALL
be trimmed, non-empty, unique ignoring case, kept in insertion order, at most 100 per entity and
100 characters each.

#### Scenario: Duplicate tag ignoring case
- **WHEN** the entity has the tag "Cible" and the user enters "cible, suspect"
- **THEN** the tags are "Cible" and "suspect"

### Requirement: Markdown notes
Each entity SHALL have optional notes (up to 100,000 characters) written in Markdown, with a
"Écrire" mode to edit and an "Aperçu" mode showing the rendered text. Existing notes SHALL open in
preview mode.

#### Scenario: Rendered notes
- **WHEN** the notes contain `**important**` and the preview is shown
- **THEN** "important" is rendered in bold

### Requirement: Delete from the panel
The entity panel SHALL offer a delete button that states how many relations will be deleted with
the entity.

#### Scenario: Entity with two relations
- **WHEN** the selected entity has two relations
- **THEN** the button reads "Supprimer l'entité et 2 relations" and deletes all three on click
