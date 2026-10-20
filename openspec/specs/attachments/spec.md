# attachments Specification

## Purpose
Lets the user keep a screenshot as proof inside a source, stored only in the browser and
fingerprinted with SHA-256 so its integrity can be checked later.

## Requirements

### Requirement: Add a screenshot to a source
The source form SHALL accept one screenshot, added by choosing a file, dropping a file on the form
or pasting an image from the clipboard.

#### Scenario: Choose a file
- **WHEN** the user clicks "Ajouter une capture" and picks a PNG file
- **THEN** a preview of the image is shown in the form

#### Scenario: Paste from the clipboard
- **WHEN** the source form is open and the user pastes an image copied to the clipboard
- **THEN** the image becomes the source's screenshot

### Requirement: Original file hint
The capture zone SHALL state that a pasted image is re-encoded and recommend adding the downloaded
file instead to keep the original bytes and metadata.

#### Scenario: Hint shown
- **WHEN** the user opens the source form
- **THEN** the capture zone shows "Une image collée est réencodée : pour conserver le fichier original et ses métadonnées, téléchargez-le puis ajoutez-le comme fichier."

### Requirement: Paste a screenshot on the graph
When exactly one entity or relation is selected and the focus is not in a text field, pasting an
image SHALL open the "Nouvelle source" form with that screenshot; saving SHALL create the source
attached to the element, cancelling SHALL create nothing. Pasting an image with no single selected
element SHALL show a hint; pasting text SHALL keep its usual behavior.

#### Scenario: Paste with an entity selected
- **WHEN** entity A is selected and the user presses Ctrl+V with an image in the clipboard, types the title "Story Instagram" and saves
- **THEN** source "Story Instagram" with that screenshot is attached to A

#### Scenario: Cancel after pasting
- **WHEN** the user pastes an image on the graph with entity A selected, then clicks "Annuler"
- **THEN** no source is created

#### Scenario: Nothing selected
- **WHEN** no element is selected and the user pastes an image on the graph
- **THEN** "Sélectionnez une entité ou une relation pour y coller une capture" is shown and nothing is created

#### Scenario: Pasting text in a field
- **WHEN** entity A is selected and the user pastes text into its label field
- **THEN** the text is inserted in the label and no source form opens

### Requirement: Accepted image formats
Only PNG, JPEG, WebP and GIF images SHALL be accepted. The format SHALL be determined from the file
content, not from its name or declared type. SVG and any other content SHALL be rejected with
"Format non pris en charge (PNG, JPEG, WebP ou GIF)".

#### Scenario: Renamed file
- **WHEN** the user picks a text file renamed `capture.png`
- **THEN** it is rejected with "Format non pris en charge (PNG, JPEG, WebP ou GIF)"

#### Scenario: SVG image
- **WHEN** the user picks an SVG file
- **THEN** it is rejected with the same message

### Requirement: Screenshot size limit
A screenshot SHALL be at most 20 MB; a larger file SHALL be rejected with "Capture trop volumineuse
(20 Mo maximum)".

#### Scenario: Oversized screenshot
- **WHEN** the user picks a 21 MB PNG file
- **THEN** it is rejected with "Capture trop volumineuse (20 Mo maximum)"

### Requirement: SHA-256 fingerprint
The SHA-256 of a screenshot SHALL be computed locally from its exact bytes, stored on the source and
shown in the source form as 64 lowercase hexadecimal characters with a button copying it to the
clipboard. By default the stored bytes SHALL be exactly those of the original file.

#### Scenario: Known content
- **WHEN** the user adds a screenshot file whose SHA-256, computed with `sha256sum`, is H
- **THEN** the source form shows exactly H

#### Scenario: Copy the fingerprint
- **WHEN** the user clicks "Copier l'empreinte"
- **THEN** the 64-character SHA-256 is copied to the clipboard and "Empreinte copiée" is shown

### Requirement: Duplicate screenshot warning
When an added file has the same SHA-256 as the screenshot, or the original file of an optimized
screenshot, of another source in the investigation, the form SHALL warn without blocking and offer
to open that source, to attach it instead when opened from an element, or to add the file anyway.

#### Scenario: Same file added twice
- **WHEN** source "Profil LinkedIn" holds a screenshot and the user adds the same file to a new source
- **THEN** "Cette capture est déjà présente dans la source « Profil LinkedIn »" is shown with "Ouvrir la source existante" and "Ajouter quand même"

#### Scenario: Attach the existing source instead
- **WHEN** the warning appears in a source created from entity A's panel and the user chooses "Rattacher cette source"
- **THEN** the new source is discarded and "Profil LinkedIn" is attached to A

#### Scenario: Original of an optimized screenshot
- **WHEN** a source holds an optimized screenshot and the user adds the original file again
- **THEN** the duplicate warning is shown

#### Scenario: Add anyway
- **WHEN** the user chooses "Ajouter quand même" and saves
- **THEN** both sources exist, each with its own screenshot

#### Scenario: Different file
- **WHEN** the added file differs by a single byte from every stored screenshot
- **THEN** no warning is shown

### Requirement: Optional screenshot optimization
For a PNG, JPEG or WebP screenshot larger than 2 MB, the form SHALL offer "Optimiser la capture",
unchecked by default. Checking it SHALL re-encode the image locally at the same resolution, show
the size before and after, and warn that metadata (EXIF) will be removed. GIF images SHALL NOT be
offered optimization.

#### Scenario: Small screenshot
- **WHEN** the user adds a 1 MB PNG screenshot
- **THEN** "Optimiser la capture" is not offered and the stored bytes are the original ones

#### Scenario: Large screenshot left as is
- **WHEN** the user adds an 8 MB PNG screenshot and saves without checking "Optimiser la capture"
- **THEN** the stored screenshot has the original bytes and SHA-256

#### Scenario: Optimize a large screenshot
- **WHEN** the user adds an 8 MB PNG screenshot and checks "Optimiser la capture"
- **THEN** the form shows "8 Mo → X Mo" with X smaller than 8, and the warning "Les métadonnées (EXIF) seront supprimées"

#### Scenario: No gain
- **WHEN** optimization would not produce a smaller file
- **THEN** the original is kept and "Optimisation sans gain, original conservé" is shown

### Requirement: Original fingerprint of an optimized screenshot
An optimized screenshot SHALL keep the SHA-256 and size of the original file beside those of the
stored image. The form SHALL show "Capture optimisée" with both fingerprints, the original one
labelled "Empreinte d'origine".

#### Scenario: Both fingerprints
- **WHEN** the user saves a source with an optimized screenshot whose original file has SHA-256 H
- **THEN** the form shows "Capture optimisée", "Empreinte d'origine" H, and the SHA-256 of the stored image, different from H

#### Scenario: Original fingerprint without the image
- **WHEN** that source is exported without screenshots and re-imported
- **THEN** the source still shows "Empreinte d'origine" H

### Requirement: Screenshot stays local
Screenshots SHALL be stored only in this browser and displayed without any network request.

#### Scenario: Display a stored screenshot
- **WHEN** the user reloads the page and opens a source with a screenshot
- **THEN** the preview is displayed and no request leaves the application's origin

### Requirement: View and download a screenshot
The user SHALL be able to open a stored screenshot at full size inside the application and to
download it with its original bytes.

#### Scenario: Full-size view
- **WHEN** the user clicks the screenshot preview
- **THEN** the image is shown at full size in a dialog that can be closed with Escape

#### Scenario: Download
- **WHEN** the user clicks "Télécharger la capture"
- **THEN** a file is downloaded whose SHA-256 equals the one shown on the source

### Requirement: Replace or remove a screenshot
The user SHALL be able to replace a source's screenshot with another one or remove it. The
previous image SHALL no longer be shown or exported for that source, and SHALL be deleted from
storage with the other unreferenced screenshots. The source's fingerprint SHALL follow the new
image or be cleared.

#### Scenario: Replace
- **WHEN** the user replaces the screenshot of a source with another image, saves and leaves the investigation
- **THEN** the source shows the new image and its SHA-256, and the old image is no longer stored

#### Scenario: Remove
- **WHEN** the user clicks "Retirer la capture" and saves
- **THEN** the source has no screenshot and no fingerprint

#### Scenario: Undo a replacement
- **WHEN** the user replaces the screenshot of a source, the save completes, and the user undoes
- **THEN** the source shows the previous image and its SHA-256 again

