# Proposal

## Why

An investigation graph usually ends up in a report, a ticket or a slide, and today the only way to
get it out of filrouge is a screenshot of the screen, cropped to the visible part, with the grid,
the controls and the current theme. Exporting the graph as an image is the last open item of the
v0.2 milestone.

## What Changes

- The graph view's **"Exporter"** button becomes a menu offering **"JSON"** (the existing export,
  unchanged), **"PNG"** and **"SVG"**. The image items download a file named after the
  investigation (`<name>.png`, `<name>.svg`), locally, without any network access. One entry point
  for every format leaves room for later ones (STIX, report).
- The image always shows the **whole graph**, framed with a margin, whatever the current pan and
  zoom, on a **white background** whatever the theme, so it reads well in printed reports.
- The image shows what the canvas shows about the investigation: each entity's type icon and
  colour, its label (or "<type> sans nom"), dashed or solid circle for hypothesis or verified,
  grade badge; each relation as a straight line between the two circles, arrow when directed,
  dashed when hypothetical, and its label with grade. Long labels are shortened with "…".
- It leaves out everything that is not investigation content: grid, mini-map, zoom controls,
  "Entité" button, selection highlight, connection handles.
- The **SVG is a real vector drawing** (shapes and text, no embedded HTML, no script, no external
  reference), so it can be edited in a vector tool. The **PNG** is the same drawing rasterised at a
  scale chosen in a confirmation dialog (1×, 2×, 4× or 8×, **4× by default**, each with its size
  in pixels), scaled down when needed so that very large graphs stay within browser canvas limits.
- With an empty graph, "PNG" and "SVG" are disabled; "JSON" stays available.

## Capabilities

### New Capabilities
- `graph-image-export`: exporting the open investigation's graph as a PNG or SVG image: entry
  point, file names, framing and background, what is drawn and what is left out, SVG safety, PNG
  scale dialog and size limits.

### Modified Capabilities
- `investigation-import-export`: in the graph view, the JSON export is reached through the
  "Exporter" menu ("JSON") instead of a direct click on "Exporter".

## Impact

- New `src/features/graph-export/`: an SVG renderer of the graph built from the store's entities
  and relations (not a capture of the React Flow DOM), PNG rasterisation through a canvas, and the
  "Exporter" menu replacing the graph view's export button.
- `src/domain/`: pure geometry shared by the canvas and the export (node size, circle centre,
  edge endpoints), so both draw links the same way; `floating-edge.tsx` reuses it.
- `src/features/entities/entity-icon.tsx`: the icon map is reused to draw icons in the SVG.
- `src/features/graph/investigation-page.tsx`: the export button becomes the menu.
- E2E tests that export JSON from the graph view (`mvp`, `sources`, `assessment`) go through the
  menu.
- No new dependency, no data model change, no `SCHEMA_VERSION` bump. The CSP already allows the
  `blob:` images used for rasterisation.
- The exported text uses a system sans-serif font, not the app's Geist font, since the file must
  not depend on fonts that are not embedded.
