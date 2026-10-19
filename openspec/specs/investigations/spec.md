# investigations Specification

## Purpose
Lets the user manage several independent investigations from a home screen: list them, create,
rename and delete them, and open one.

## Requirements

### Requirement: List investigations
The home screen SHALL list every investigation stored in this browser, most recently modified
first, showing its name, its description when present, and its last modification date.

#### Scenario: Several investigations
- **WHEN** investigation A was modified after investigation B
- **THEN** A is listed above B, each with its name and "Modifiée le <date>"

#### Scenario: No investigation
- **WHEN** no investigation is stored
- **THEN** an empty state invites the user to create one or import a JSON file

### Requirement: Create an investigation
The user SHALL be able to create an investigation with a required name (1 to 200 characters
after trimming) and an optional description. After creation the new investigation SHALL open.

#### Scenario: Create with a name
- **WHEN** the user clicks "Nouvelle enquête", enters "Opération Fil Rouge" and confirms
- **THEN** the investigation is stored and its graph opens with that name as heading

#### Scenario: Blank name
- **WHEN** the name field is empty or contains only spaces
- **THEN** the "Créer" button is disabled

### Requirement: Rename an investigation
The user SHALL be able to change the name and description of an existing investigation from its
action menu. The change SHALL update its modification date.

#### Scenario: Rename
- **WHEN** the user chooses "Renommer", enters a new name and saves
- **THEN** the list shows the new name and the investigation moves to the top of the list

### Requirement: Delete an investigation
The user SHALL be able to delete an investigation after an explicit confirmation. Deletion SHALL
remove the investigation and all its entities, relations, sources and attachments from this
browser.

#### Scenario: Confirmed deletion
- **WHEN** the user chooses "Supprimer" and confirms in the dialog
- **THEN** the investigation and all its content are removed and it disappears from the list

#### Scenario: Cancelled deletion
- **WHEN** the user chooses "Supprimer" then "Annuler"
- **THEN** nothing is deleted

### Requirement: Open an investigation
Selecting an investigation in the list SHALL open its graph view.

#### Scenario: Open from the list
- **WHEN** the user clicks an investigation in the list
- **THEN** its graph view is displayed with its name as heading and a link back to the list
