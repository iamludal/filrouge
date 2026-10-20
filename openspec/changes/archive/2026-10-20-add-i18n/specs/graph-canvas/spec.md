# Spec Delta

## MODIFIED Requirements

### Requirement: Grade explained on hover
Hovering a node's grade badge or a graded link label SHALL show the full meaning of the grade in
the active language, and the badge SHALL expose the same text to assistive technologies.

#### Scenario: Hover a badge
- **WHEN** the user hovers the "B2" badge of a node
- **THEN** the text "Cotation B2 : source habituellement fiable, information probablement vraie" is shown

#### Scenario: Hover a badge in English
- **WHEN** the interface is in English and the user hovers the "B2" badge of a node
- **THEN** the text "Rating B2: usually reliable source, probably true information" is shown

#### Scenario: Confirmed information in English
- **WHEN** the interface is in English and the user hovers the "A1" badge of a node
- **THEN** the text "Rating A1: completely reliable source, information confirmed by other sources" is shown
