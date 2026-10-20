# pivot-tools Specification

## Purpose

Helps the investigator continue an investigation from an entity: lists the OSINT tools that apply
to its type, opens them on the entity's value or as a reminder link, and records per entity which
tools were already used and when.

## Requirements

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

### Requirement: Tools tab in the entity panel
The entity panel SHALL have two tabs, "Détails" (the existing editor, selected by default) and
"Outils", whose label shows how many of the tools applying to the entity's type are checked. The
"Outils" tab SHALL list those tools grouped by category, category names in the active language,
tool names untranslated. Each tool SHALL be on a single line: its checkbox, its name and host,
and its check date once checked.

#### Scenario: Details by default
- **WHEN** the user selects an entity
- **THEN** the "Détails" tab is selected and the "Outils" tab shows 0 checked tools out of the number of tools for its type

#### Scenario: Grouped in English
- **WHEN** the interface is in English and the user opens the "Tools" tab of an email entity
- **THEN** the tools are listed under English category headings and "Have I Been Pwned" keeps its name

#### Scenario: Mobile drawer
- **WHEN** an entity is selected in a 412 px wide viewport and the drawer is expanded
- **THEN** the "Détails" and "Outils" tabs are available in the drawer

#### Scenario: Long names on a narrow screen
- **WHEN** the "Outils" tab of an email entity is open in a 360 px wide viewport
- **THEN** every checkbox is on the same line as its tool's link, and nothing scrolls horizontally

### Requirement: Tools follow the entity type
Changing an entity's type SHALL update the listed tools to those of the new type. Checks of tools
that no longer apply SHALL be kept, hidden, and shown again if the type is changed back.

#### Scenario: Type change keeps checks
- **WHEN** the user checks crt.sh on a "domain" entity, changes its type to "url", then back to "domain"
- **THEN** crt.sh is listed as checked with its original date

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

### Requirement: Query links need a label
When the entity's label is empty or blank, query links SHALL be disabled with an explanation,
while plain links stay usable.

#### Scenario: Unnamed entity
- **WHEN** the user opens the "Outils" tab of an "alias" entity with an empty label
- **THEN** WhatsMyName is disabled and states that a label is needed, and sherlock can still be opened

### Requirement: Phone numbers in query links
For a "phone" entity, query links SHALL use the label without spaces, dots, hyphens, slashes and
parentheses, keeping the leading "+" and every other character. The stored label SHALL NOT change.

#### Scenario: International number
- **WHEN** a "phone" entity is labelled "+33 6 12 34 56 78" and the user looks at its Dehashed link
- **THEN** the link's target is `https://dehashed.com/search?query=%2B33612345678` and the entity's label is still "+33 6 12 34 56 78"

#### Scenario: National number with separators
- **WHEN** a "phone" entity is labelled "(06) 12.34-56/78" and the user looks at its Google link
- **THEN** the link's target is `https://www.google.com/search?q=%220612345678%22`

#### Scenario: Separators only
- **WHEN** a "phone" entity is labelled " - . - "
- **THEN** its query links are disabled as for an empty label

### Requirement: Plain links
A tool whose link is plain SHALL open its site or source repository, independently of the
entity's label.

#### Scenario: Command-line tool
- **WHEN** the user looks at sherlock's link on an "alias" entity labelled "jdupont"
- **THEN** the link's target is `https://github.com/sherlock-project/sherlock`

### Requirement: Opening a tool
Every tool link SHALL be a link whose target is its resolved `https` address, opening in a new tab
without giving the new page access to filrouge and without sending a referrer. The host of the
address SHALL be displayed next to the tool's name.

#### Scenario: Link attributes
- **WHEN** the user looks at crt.sh's link on a "domain" entity
- **THEN** the link opens in a new tab, has `rel` "noopener noreferrer", its target starts with `https://`, and "crt.sh" is displayed next to its name

### Requirement: No public submission
No catalog link SHALL ask a service to scan, archive or publish the value: links to archives,
urlscan.io and VirusTotal SHALL only look up existing results.

#### Scenario: urlscan.io on a domain
- **WHEN** the user looks at urlscan.io's link on a "domain" entity labelled "exemple.fr"
- **THEN** the link's target is urlscan.io's existing results for "exemple.fr", not its scan submission

### Requirement: Manual tool check
Each listed tool SHALL have a checkbox, separate from its link, that records the tool as used on
this entity at the current instant and shows that date. Opening a tool SHALL NOT check it.

#### Scenario: Check a tool
- **WHEN** the user checks holehe on an email entity
- **THEN** holehe is shown as checked with today's date, and the "Outils" tab counts one checked tool

#### Scenario: Opening does not check
- **WHEN** the user opens holehe's link
- **THEN** holehe stays unchecked

#### Scenario: Checks are per entity
- **WHEN** the user checks holehe on email entity A
- **THEN** holehe stays unchecked on email entity B

### Requirement: Uncheck a tool
Unchecking a tool SHALL remove its record from the entity. Checking it again SHALL record the new
instant.

#### Scenario: Uncheck then check again
- **WHEN** the user unchecks holehe, checked yesterday, then checks it again
- **THEN** holehe is shown as checked with today's date

### Requirement: Tool checks are saved and exported
Tool checks SHALL be saved with the entity and kept after a reload. The export SHALL include, for
each entity with checks, a `toolChecks` list of `toolId` and `checkedAt` (ISO 8601 UTC). An entity
without checks SHALL be exported without a `toolChecks` field.

#### Scenario: Reload
- **WHEN** the user checks crt.sh on a domain entity and reloads the page
- **THEN** crt.sh is still checked with the same date

#### Scenario: Export
- **WHEN** the user checks crt.sh on a domain entity and exports the investigation
- **THEN** the entity has `toolChecks` with one item whose `toolId` is crt.sh's identifier and whose `checkedAt` is the check instant

#### Scenario: Round trip
- **WHEN** an investigation with tool checks is exported, deleted, re-imported and exported again
- **THEN** both files have the same `toolChecks`

### Requirement: Tool check validation
On import and save, each tool check SHALL have an identifier of 1 to 64 lowercase letters, digits
and hyphens and an ISO 8601 UTC date; an entity SHALL hold at most 200 checks and at most one per
tool. A file breaking these rules SHALL be rejected.

#### Scenario: Duplicate check
- **WHEN** the user imports a file where an entity has two checks with the same `toolId`
- **THEN** the import is refused with an error naming the faulty field

#### Scenario: Invalid identifier
- **WHEN** the user imports a file where a check's `toolId` is "<script>"
- **THEN** the import is refused

### Requirement: Unknown tools are kept
A check whose identifier matches no catalog tool SHALL be kept with the entity and exported
unchanged, without being displayed or counted.

#### Scenario: Check from another version
- **WHEN** the user imports a file where an entity has a check for "future-tool", then exports it
- **THEN** the "Outils" tab does not count it and the exported entity still has that check

### Requirement: Keyboard and touch access to tools
The tabs, every tool link and every checkbox SHALL be reachable and usable with the
keyboard, each checkbox labelled with its tool's name. On narrow screens, each SHALL be at least
44 × 44 CSS pixels.

#### Scenario: Keyboard check
- **WHEN** the user moves from the "Détails" tab to the "Outils" tab with the arrow key, tabs to the checkbox "Marquer crt.sh comme utilisé" and presses Space
- **THEN** crt.sh is checked

#### Scenario: Touch targets
- **WHEN** a domain entity's "Outils" tab is open in a 412 px wide viewport
- **THEN** the "Outils" tab, crt.sh's link and its checkbox each measure at least 44 × 44 px
