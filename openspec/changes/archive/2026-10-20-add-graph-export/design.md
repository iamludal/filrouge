# Design

## Context

See proposal.md for motivation and `specs/graph-image-export/spec.md` for the expected output.
Current state, read from `src/` at commit `fadbb3b`:

- `useGraphStore` (`src/store/graph-store.ts`) holds the open investigation in memory:
  `investigation`, `entities` and `relations` as records keyed by id. It is always at least as
  fresh as storage, so an export built from it includes unsaved edits.
- The canvas draws nodes with `EntityNode` (`src/features/graph/entity-node.tsx`): a 144 px wide
  node (`w-36`), a 48 px circle at its top with a 2 px border in the type colour (dashed for a
  hypothesis), the type icon (20 px) inside, the grade badge at the circle's top right, and the
  label below. `entity.position` is the node's top-left corner.
- `FloatingEdge` (`src/features/graph/floating-edge.tsx`) draws a straight segment between the
  two circle centres, shortened by the circle radius (26 px, +2 px at the arrow end), dashed
  `6 4` for a hypothesis, with `relationLabelText(label, confidence)` at its middle.
  `graph-canvas.tsx` has its own `NODE_HALF_WIDTH = 72`.
- Type icons are lucide-react components mapped in `src/features/entities/entity-icon.tsx`.
- `downloadBlob` and `safeFilename` (`src/lib/download.ts`) already serve the JSON export.
- The CSP allows `img-src 'self' data: blob:`; nothing else is needed to load an SVG blob into an
  `<img>` and draw it on a canvas. E2E runs in Chromium only.

## Goals / Non-Goals

**Goals:**
- A true vector SVG and a PNG built from the same drawing, so both always match.
- Output that depends only on the investigation data: deterministic, testable in jsdom.
- One source of truth for node and edge geometry shared with the canvas.

**Non-Goals:**
- Pixel-identical rendering with the canvas (font, shadows and hover states differ).
- Exporting only the visible viewport or only the selection, or choosing a background or scale.
- Drawing sources, notes, properties or tags: only what the canvas shows on the graph.
- Embedding the Geist font in the files.

## Decisions

### Draw the SVG from the store data, not by capturing the React Flow DOM

A `GraphImage` React component renders a plain `<svg>` from `entities` and `relations`; it is
rendered off-document and serialised to a string (see below). The PNG is that string loaded into
an `<img>` and drawn on a `<canvas>`.

Alternative: `html-to-image` (React Flow's documented recipe). It gives an exact copy of the
screen with little code, but its SVG is HTML inside a `foreignObject` (not editable in vector
tools, poorly supported outside browsers, and a `foreignObject` image taints the canvas in
Safari), it needs a new dependency, it must strip the grid, controls, mini-map and selection
from a live DOM, it inlines styles and fonts by reading stylesheets, and it cannot be tested
meaningfully in jsdom. The cost of our approach is redrawing nodes and edges a second time; the
shared geometry module keeps the two drawings aligned.

### Rendering and serialisation with React, without `dangerouslySetInnerHTML`

`renderGraphSvg({ name, entities, relations, measureText })` creates a detached `div`, renders
`<GraphImage>` into it with `createRoot` + `flushSync`, reads the `<svg>` element, serialises it
with `XMLSerializer` (which escapes text and attributes and writes the SVG namespace), unmounts,
and returns `{ svg, width, height }`. React's escaping is what makes a hostile label harmless: no
string concatenation of user text anywhere. `react-dom/server` is not used, to keep it out of the
bundle. The function prepends `<?xml version="1.0" encoding="UTF-8"?>`.

The `<svg>` has `width`/`height` equal to the drawing size and a matching `viewBox` translated to
the bounds' origin, a `<title>` with the investigation name, a white `<rect>` covering the whole
viewBox, then edges (below), then nodes. One `<marker id="arrow">` in `<defs>` is referenced as
`marker-end="url(#arrow)"`: an internal fragment, not an external reference.

### Shared geometry in `src/domain/graph-geometry.ts`

Pure module with `NODE_WIDTH` (144), `CIRCLE_RADIUS` (24), `CIRCLE_CENTER_Y` (24),
`EDGE_ATTACH_RADIUS` (26), `circleCenter(position)` and `edgeSegment(fromCenter, toCenter)`
returning the shortened segment and its midpoint. `FloatingEdge` and `graph-canvas.tsx` switch to
it (`FloatingEdge` keeps using React Flow's absolute position, which equals `entity.position` for
these top-level nodes; node width is fixed by `w-36`, so the measured width is not needed).

### Text: system font, measured widths, code-point truncation

Exported text uses the stack `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto,
Helvetica, Arial, sans-serif`: an SVG loaded as an image cannot use the page's fonts, and the
file must look the same when opened elsewhere. Label boxes and badges need text widths, so
`renderGraphSvg` takes a `measureText(text, font)` function. The browser implementation uses a
cached `CanvasRenderingContext2D.measureText` with the same font; tests pass an estimate (0.6 em
per character), since jsdom has no canvas. Node labels are centred under the circle and cut by
`truncate(text, max)` (`src/lib/format.ts`), which counts code points (`Array.from`) so an emoji
or accented letter is never split: 24 for entities, 28 for relations, as in the spec.

### Colours fixed to the light palette

The export always uses light colours, independent of `useTheme`: white background, white circle
fill, type colour for border and icon, dark text (`#0a0a0a`) for labels, muted grey (`#737373`)
for unlabelled names (italic), edge lines and edge labels, light grey borders for the badge and
label boxes. Constants live in the export module; they mirror the light tokens of `index.css`.

### Icons from the lucide components

The `type → lucide component` map moves from `entity-icon.tsx` to
`src/features/entities/entity-icons.ts` (a component file must only export components for
react-refresh) and is used by both `EntityIcon` and `GraphImage`. In the SVG, the icon component
is rendered as a nested `<svg x y width="20" height="20" color={type.color}>`, which lucide
supports through its props; its `class` attributes are harmless in a standalone file.

### Bounds, margin and PNG size

Bounds are the union of each node's circle, label and badge boxes, each edge's segment and label
box (from measured text widths), plus a 32 px margin, rounded out to whole pixels.
`pngSize(width, height, scale)` (pure) returns
`effective = min(scale, 16384 / width, 16384 / height, sqrt(16777216 / (width × height)))`, the
floored dimensions and whether the size was limited. The scales offered are `PNG_SCALES = [1, 2, 4, 8]`
with `DEFAULT_PNG_SCALE = 4`: a small graph is only a few hundred pixels wide, so 2× looks
pixelated once enlarged in a report, while 8× serves posters and full-screen slides.
Rasterisation (`svgToPng`) first sets the SVG's `width`/`height` to the PNG size (`sizedSvg`,
viewBox unchanged), so the browser rasterises the vector drawing at full resolution rather than
enlarging a bitmap of its original size (Safari does the latter with `drawImage` scaling). It then
loads the SVG blob URL in an `Image`, draws it on a white canvas of that size, calls
`toBlob('image/png')` and revokes the URL; a load failure or a `null` blob rejects.

### "Exporter" menu

`ExportMenu` (`src/features/graph-export/export-menu.tsx`) replaces the graph view's "Exporter"
button: a shadcn `DropdownMenu` whose trigger is the same outline "Exporter" button (`FileDown`).
Items: "JSON", then "PNG" and "SVG". "JSON" calls an `onExportJson` prop, which
`investigation-page.tsx` wires to the current behaviour (`autosave.flush()` then
`exportInvestigation(id)`, screenshot dialog included), so the JSON flow is untouched. "PNG" and
"SVG" are disabled when `Object.keys(entities).length === 0` (selector returning a boolean). Both
read the store once with `getState()` and render the SVG. "SVG" downloads it at once with
`downloadBlob(safeFilename(name, 'svg'), blob)`; "PNG" keeps the rendered SVG and its size in
state and opens the PNG dialog. Any rejection shows
`toast.error('Impossible d’exporter l’image')` and nothing is downloaded; the error itself is not
logged (it could echo content).

Alternative: a separate "Image" button. Rejected: two export entry points side by side, more
toolbar width, and no natural home for the formats planned for v1.0. The cost of the menu is that
three e2e tests that clicked "Exporter" now pick "JSON"; a `exportJson(page)` helper in
`tests/e2e/helpers.ts` keeps them short.

### PNG scale dialog

`PngExportDialog` (`src/features/graph-export/png-export-dialog.tsx`) follows `ExportDialog`: a
shadcn `Dialog` whose form is mounted only while open, so its state resets to 4× on each opening
(nothing is stored). Scales are a shadcn `RadioGroup` labelled "Échelle" (native radios render
clipped once resized, and Radix gives roving focus: only the checked scale is in the Tab order);
each label reads "4× (recommandé)" etc. followed by
`pngSize(...)` formatted with `toLocaleString('fr-FR')` ("1 644 × 1 344 px") and "(limitée)" when
capped. "Exporter" has `autoFocus`, so the dialog does not focus (and outline) the first scale on
opening and Enter exports at the recommended scale. "Exporter" closes the dialog and calls `svgToPng(svg, width, height, scale)` then
`downloadBlob`; a rejection shows the error toast. The SVG is rendered when the dialog opens: the
dialog is modal, so the graph cannot change while it is open.

Alternative: a "PNG" submenu listing the scales (one click less, no default selection). Rejected
by the product owner: the dialog shows a default, and leaves room for future PNG options
(e.g. transparent background).

## Risks / Trade-offs

- [Canvas and export drift apart when the node design changes] → Shared geometry module, and a
  unit test asserting the export's circle and segment coordinates against the same helpers used
  by `FloatingEdge`.
- [Text width differs between the measuring font and the font finally used by a viewer] → Label
  boxes get 6 px of padding; cut labels are short enough that a small mismatch stays inside.
- [Huge graphs make a big PNG and block the main thread while drawing] → Size cap from
  `pngSize`; drawing a few thousand SVG shapes once is acceptable for an explicit user action.
- [`decode()` on an SVG blob may fail in some browsers] → Fall back to the `load`/`error` events
  of `Image`; any failure ends in the error toast.
- [The SVG exposes the full investigation labels in a file] → Same exposure as the JSON export,
  triggered by the user; nothing leaves the device.
