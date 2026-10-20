# Spec Delta

## MODIFIED Requirements

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
