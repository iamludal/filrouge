# Spec Delta

## ADDED Requirements

### Requirement: Image follows the display options
The image SHALL leave out what the display options hide on the canvas (see graph-display-options):
entity labels, relation labels, ratings and the important mark. Its frame SHALL fit what is drawn,
with the usual margin. Hiding the mini-map SHALL have no effect on the image.

#### Scenario: Entity labels hidden
- **WHEN** "Libellés des entités" is unchecked and the user exports the SVG of a graph holding entity "Jean Dupont"
- **THEN** the SVG does not hold the text "Jean Dupont"

#### Scenario: Frame fits the drawing
- **WHEN** "Libellés des entités" is unchecked and the user exports the SVG of a graph whose widest element is a long entity label
- **THEN** the SVG is narrower than the one exported with the option checked, and every circle lies at least 32 pixels inside its bounds

#### Scenario: Ratings hidden
- **WHEN** "Cotations" is unchecked, an entity is graded "B2", a relation labelled "connaît" is graded "C3", and the user exports the SVG
- **THEN** the SVG holds the text "connaît" but neither "B2" nor "C3"

#### Scenario: Important mark hidden
- **WHEN** "Marque « Important »" is unchecked, entity A is important, and the user exports the SVG
- **THEN** A's circle has a 2 px stroke and a white fill, and no flag badge is drawn

#### Scenario: Default display
- **WHEN** every display option is checked, an important entity "Jean" is graded "B2", and the user exports the SVG
- **THEN** the SVG holds the text "Jean", the text "B2" and a flag badge next to Jean's circle
