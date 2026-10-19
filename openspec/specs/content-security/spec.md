# content-security Specification

## Purpose
Protects the confidentiality of investigations and the user's browser: no data leaves the device,
and untrusted text (typed or imported) can never run code or trigger requests.

## Requirements

### Requirement: No outgoing requests
The application SHALL NOT make any network request to another origin at runtime: no telemetry,
analytics, third-party script, remote font or CDN.

#### Scenario: Load the application
- **WHEN** the production build is loaded and used
- **THEN** every request targets the application's own origin (or `data:`/`blob:` URLs)

### Requirement: Content Security Policy
The production build SHALL enforce a Content-Security-Policy that allows scripts, styles, fonts and
connections from its own origin only, images from its own origin and `data:`/`blob:` URLs, forbids
`eval`, plugins and form submission, and restricts `<base>` to its own origin.

#### Scenario: Clean load
- **WHEN** the production build is loaded
- **THEN** no Content-Security-Policy violation is reported

#### Scenario: Remote image
- **WHEN** a remote image URL ends up in the page
- **THEN** the browser blocks the request

### Requirement: Safe Markdown rendering
Rendered notes SHALL never contain raw HTML or images; only `http`, `https` and `mailto` links
SHALL be kept, opened in a new tab without referrer. Other links SHALL be rendered as plain text.

#### Scenario: HTML injection in notes
- **WHEN** the notes contain `<img src=x onerror=alert(1)>`
- **THEN** no image element is rendered and no script runs

#### Scenario: Script link
- **WHEN** the notes contain `[clic](javascript:alert(1))`
- **THEN** "clic" is rendered without a working link

### Requirement: No referrer
The application SHALL ask the browser not to send a referrer with any navigation.

#### Scenario: Follow a link from notes
- **WHEN** the user follows an external link from rendered notes
- **THEN** the target site receives no referrer

### Requirement: Bounded input sizes
Typed and imported text SHALL be bounded: names 200 characters, labels 500, notes and descriptions
100,000, URLs 2,048, so that hostile data cannot exhaust memory or the renderer.

#### Scenario: Oversized label in an import
- **WHEN** an imported entity has a 501-character label
- **THEN** the import is rejected

### Requirement: No content in logs
The application SHALL NOT write investigation content to the browser console.

#### Scenario: Failed import
- **WHEN** an import fails unexpectedly
- **THEN** the console shows at most the error type, never the file content
