# Spec Delta

## MODIFIED Requirements

### Requirement: Built-in tool catalog
The application SHALL ship a fixed catalog of OSINT tools. Each tool SHALL have a stable
identifier, a name, a category and the entity types it applies to. Search engines, SpiderFoot and
OSINT Framework SHALL apply to every entity type. The catalog SHALL NOT be editable from the interface.

#### Scenario: Tools for a domain
- **WHEN** the user selects a "domain" entity and opens its "Outils" tab
- **THEN** crt.sh, Shodan, Analyzeid, BuiltWith and the search engines are listed, and sherlock is not

#### Scenario: Tools for a vehicle
- **WHEN** the user selects a "vehicle" entity and opens its "Outils" tab
- **THEN** vindecoder.net and vindecoder.pl are listed under the "Véhicules" category, after the search engines

#### Scenario: Tools for a person
- **WHEN** the user selects a "person" entity and opens its "Outils" tab
- **THEN** OCCRP Aleph and OpenSanctions are listed under the "Bases d'enquête" category

#### Scenario: Type without specific tools
- **WHEN** the user selects an "event" entity and opens its "Outils" tab
- **THEN** only the tools that apply to every type are listed: the search engines, SpiderFoot and OSINT Framework

#### Scenario: Catalog is read-only
- **WHEN** the user opens the "Outils" tab of any entity
- **THEN** no control to add, edit or delete a tool is offered

### Requirement: Query links
A tool whose link is a query SHALL open an address built from its template, with `{value}`
replaced by the entity's label, trimmed and percent-encoded so that no character of the label
can change the address's structure.

#### Scenario: Encoded label
- **WHEN** a "person" entity is labelled " Jean Dupont & Cie " and the user looks at its Google link
- **THEN** the link's target is `https://www.google.com/search?q=%22Jean%20Dupont%20%26%20Cie%22`

#### Scenario: Domain pivot
- **WHEN** a "domain" entity is labelled "exemple.fr" and the user looks at its crt.sh link
- **THEN** the link's target is `https://crt.sh/?q=exemple.fr`

#### Scenario: Sanctions lookup
- **WHEN** an "organization" entity is labelled "Gazprom" and the user looks at its OpenSanctions link
- **THEN** the link's target is `https://www.opensanctions.org/search/?q=Gazprom`

#### Scenario: Keyword in registered domains
- **WHEN** an "alias" entity is labelled "lemonde" and the user looks at its dotDB link
- **THEN** the link's target is `https://dotdb.com/search?keyword=lemonde&position=any`

#### Scenario: Censys host
- **WHEN** an "ip" entity is labelled "8.8.8.8" and the user looks at its Censys link
- **THEN** the link's target is `https://platform.censys.io/hosts/8.8.8.8`

#### Scenario: VIN lookup
- **WHEN** a "vehicle" entity is labelled "1HGCM82633A004352" and the user looks at its vindecoder.pl link
- **THEN** the link's target is `https://vindecoder.pl/report/1HGCM82633A004352`
