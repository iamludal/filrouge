# graph-image-export Specification

## Purpose

Lets the user take the graph of an open investigation out of filrouge as a PNG or SVG image, to
put it in a report or a presentation, without any data leaving the device.

## Requirements

### Requirement: Export the graph as an image
The "Exporter" menu of the graph view toolbar SHALL offer the items "PNG" and "SVG", after "JSON".
Choosing one SHALL download, locally and without any network request, an image of the investigation's graph
named after the investigation with only letters, digits, dashes and underscores, ending in `.png`
or `.svg`. The image SHALL reflect the latest edits, saved or not.

#### Scenario: Export as PNG
- **WHEN** the user opens "Exporter" in the investigation "Opération Fil Rouge", chooses "PNG" and confirms the dialog
- **THEN** a file `Opération-Fil-Rouge.png` holding a PNG image is downloaded

#### Scenario: Export as SVG
- **WHEN** the user opens "Exporter" in the investigation "Opération Fil Rouge" and chooses "SVG"
- **THEN** a file `Opération-Fil-Rouge.svg` holding an SVG image is downloaded

#### Scenario: Unsaved edit included
- **WHEN** the user renames an entity and exports the SVG before "Enregistré" is shown
- **THEN** the SVG shows the new label

### Requirement: Empty graph
The "PNG" and "SVG" items SHALL be disabled while the investigation has no entity; "JSON" SHALL
stay enabled.

#### Scenario: No entity
- **WHEN** the user opens "Exporter" in an investigation without entities
- **THEN** "PNG" and "SVG" are disabled and "JSON" is enabled

#### Scenario: First entity added
- **WHEN** the user adds an entity to an empty investigation and opens "Exporter"
- **THEN** "PNG" and "SVG" are enabled

### Requirement: Whole graph on a white background
The image SHALL show every entity and relation of the investigation, whatever the current pan and
zoom, framed with a margin of at least 32 pixels around the drawing, on an opaque white
background whatever the active theme.

#### Scenario: Entities outside the view
- **WHEN** the user zooms in on one entity of a 10-entity graph and exports the SVG
- **THEN** the SVG shows all 10 entities

#### Scenario: Dark theme
- **WHEN** the dark theme is active and the user exports the PNG
- **THEN** the image background is white and the labels are dark

### Requirement: Entity drawing
Each entity SHALL be drawn as on the canvas: a circle bordered with its type's colour holding its
type's icon, its label below (or "<type label> sans nom" when empty), a dashed border when it is a
hypothesis and a solid one when verified, and its grade (e.g. "B2") in a badge when graded. A label
longer than 24 characters SHALL be cut to its first 23 characters followed by "…".

#### Scenario: Unlabelled entity
- **WHEN** the graph holds a "Personne" entity with an empty label and the user exports the SVG
- **THEN** the SVG holds the text "Personne sans nom"

#### Scenario: Hypothetical and verified entities
- **WHEN** entity A is a hypothesis, entity B is verified and the user exports the SVG
- **THEN** A's circle is drawn with a dashed stroke and B's with a solid stroke

#### Scenario: Graded entity
- **WHEN** an entity is graded "B2" and the user exports the SVG
- **THEN** the SVG holds the text "B2" next to that entity's circle

#### Scenario: Long label
- **WHEN** an entity's label is "Société anonyme des transports réunis" and the user exports the SVG
- **THEN** the SVG holds the text "Société anonyme des tra…" and not the full label

### Requirement: Relation drawing
Each relation SHALL be drawn as a straight line between the circles of its two entities, with an
arrow at the target when it is directed, dashed when it is a hypothesis and solid when verified.
Its label SHALL be written at the middle of the line as on the canvas (label, " · ", grade), and a
label longer than 28 characters SHALL be cut to its first 27 characters followed by "…".

#### Scenario: Directed hypothetical relation
- **WHEN** a directed relation A→B is a hypothesis and the user exports the SVG
- **THEN** its line is dashed and ends with an arrow at B

#### Scenario: Graded relation
- **WHEN** a relation labelled "connaît" is graded "C3" and the user exports the SVG
- **THEN** the SVG holds the text "connaît · C3"

#### Scenario: Relation without label nor grade
- **WHEN** a relation has an empty label and no grade
- **THEN** its line is drawn without any label

### Requirement: Only investigation content
The image SHALL NOT show the grid, the mini-map, the zoom controls, the "Entité" button, the
empty-graph hint, connection handles nor any selection highlight.

#### Scenario: Selected elements
- **WHEN** the user selects two entities and one relation, then exports the PNG
- **THEN** the image is identical to the one exported with nothing selected

### Requirement: Self-contained vector SVG
The SVG file SHALL be a standalone vector drawing made of shapes and text: it SHALL NOT contain
scripts, event handler attributes, embedded HTML (`foreignObject`), raster images nor references to
any external resource, and its text SHALL be the escaped content of the investigation.

#### Scenario: Hostile label
- **WHEN** an entity is labelled `<script>x()</script>` and the user exports the SVG
- **THEN** the SVG contains no `script` element and shows the label as text

#### Scenario: No external reference
- **WHEN** the user exports the SVG of any investigation
- **THEN** the file contains no `foreignObject`, no `image` element and no `href` to a URL

### Requirement: PNG scale dialog
Choosing "PNG" SHALL open a dialog offering the scales 1×, 2×, 4× and 8× of the drawing, with 4×
selected and marked "recommandé", each showing the resulting size in pixels. "Exporter" SHALL
download the PNG at the selected scale; "Annuler", Escape or closing the dialog SHALL download
nothing. The choice SHALL NOT be remembered: the dialog opens on 4× every time.

#### Scenario: Default scale
- **WHEN** the drawing of the graph is 411 × 336 pixels and the user chooses "PNG"
- **THEN** the dialog shows "4× (recommandé)" selected with "1 644 × 1 344 px"

#### Scenario: Smaller scale
- **WHEN** the drawing of the graph is 411 × 336 pixels, the user chooses "PNG", selects "1×" and clicks "Exporter"
- **THEN** a PNG of 411 × 336 pixels is downloaded

#### Scenario: Cancel
- **WHEN** the user chooses "PNG" then clicks "Annuler"
- **THEN** no file is downloaded

#### Scenario: Scale not remembered
- **WHEN** the user exports a PNG at 1×, then chooses "PNG" again
- **THEN** the dialog shows 4× selected

### Requirement: PNG size limits
When the selected scale would make the PNG exceed 16,384 pixels on a side or 16,777,216 pixels in
total, the PNG SHALL be scaled down, keeping its proportions, to the largest size within both
limits, and the dialog SHALL show that reduced size marked "(limitée)".

#### Scenario: Usual graph at the default scale
- **WHEN** the drawing of the graph is 1,200 × 800 pixels and the user exports the PNG at 4×
- **THEN** the PNG is 4,800 × 3,200 pixels

#### Scenario: Area limit
- **WHEN** the drawing of the graph is 1,200 × 800 pixels and the user selects 8×
- **THEN** the dialog shows "5 016 × 3 344 px (limitée)" and the downloaded PNG has that size

#### Scenario: Very large graph
- **WHEN** the drawing of the graph is 20,000 × 1,000 pixels and the user exports the PNG at 4×
- **THEN** the PNG is 16,384 × 819 pixels

### Requirement: Export failure
When the image cannot be produced, the application SHALL show the error "Impossible d'exporter
l'image" and SHALL NOT download any file.

#### Scenario: Rendering fails
- **WHEN** the user confirms the PNG dialog and the browser fails to render the PNG
- **THEN** the error "Impossible d'exporter l'image" is shown and no file is downloaded
