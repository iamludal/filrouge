# app-shell Specification

## Purpose
Provides the application frame shared by every screen: navigation between the home screen and an
investigation through the URL, and the user's colour theme.

## Requirements

### Requirement: Hash-based navigation
The application SHALL derive the current screen from the URL fragment: `#/i/<investigation-id>`
opens that investigation, any other fragment shows the home screen. Navigation SHALL work on a
static host without server-side rewrites.

#### Scenario: Open an investigation by URL
- **WHEN** the user loads the application with the fragment `#/i/<id>` of an existing investigation
- **THEN** the investigation graph is displayed

#### Scenario: Unknown fragment
- **WHEN** the user loads the application with a fragment that does not match `#/i/<uuid>`
- **THEN** the home screen is displayed

#### Scenario: Back to the home screen
- **WHEN** the user activates the "filrouge" title in the header
- **THEN** the home screen is displayed

### Requirement: Missing investigation
The application SHALL show a "not found" message with a link back to the home screen when the URL
references an investigation that does not exist in this browser.

#### Scenario: Investigation absent from this browser
- **WHEN** the user opens `#/i/<id>` for an id that is not stored locally
- **THEN** the message "Enquête introuvable dans ce navigateur." and a "Retour aux enquêtes" link are shown

### Requirement: Theme preference
The user SHALL be able to choose a light, dark or system theme. The choice SHALL persist in this
browser, and "system" SHALL follow the operating system's colour scheme.

#### Scenario: Choose dark theme
- **WHEN** the user selects "Sombre" in the theme menu and reloads the page
- **THEN** the application is rendered with the dark theme

#### Scenario: Default to system
- **WHEN** no theme was chosen and the operating system prefers a dark colour scheme
- **THEN** the application is rendered with the dark theme

### Requirement: No theme flash
The stored theme SHALL be applied before the first paint, so the page never flashes the wrong
theme while loading.

#### Scenario: Reload with dark theme
- **WHEN** the dark theme is stored and the page loads
- **THEN** the document root carries the dark theme before the application renders
