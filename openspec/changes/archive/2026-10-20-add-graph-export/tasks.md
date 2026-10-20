# Tasks

Each numbered group is one Conventional Commit. Every group ends green on
`bun run lint && bun run format:check && bun run typecheck && bun run test`
(plus `bun run test:e2e` when it changes the UI). Agents do not commit: they leave the group in
the working tree and propose its commit message.

## 1. Shared geometry and icons – `refactor(graph): share node geometry and entity icons with the image export`

- [x] 1.1 Add `src/domain/graph-geometry.ts` (`NODE_WIDTH`, `CIRCLE_RADIUS`, `CIRCLE_CENTER_Y`, `EDGE_ATTACH_RADIUS`, `circleCenter`, `edgeSegment` with midpoint); verify `src/domain/graph-geometry.test.ts` (horizontal, diagonal and zero-length segments, arrow-end offset)
- [x] 1.2 Make `FloatingEdge` use `edgeSegment` and `graph-canvas.tsx` use `NODE_WIDTH / 2` instead of `NODE_HALF_WIDTH`; verify `floating-edge.test.tsx` passes unchanged and `bun run test:e2e` shows links and new-node placement as before
- [x] 1.3 Move the type → lucide component map to `src/features/entities/entity-icons.ts` and use it in `EntityIcon`; verify `entity-node.test.tsx` passes and lint reports no react-refresh warning
- [x] 1.4 Add `truncate(text, max)` to `src/lib/format.ts` (code points, "…" suffix); verify `format.test.ts` cases: under, at and over the limit, an emoji and a combining-free accented label at the cut point

## 2. SVG renderer – `feat(graph-export): render the investigation graph as a standalone SVG`

- [x] 2.1 Add `src/features/graph-export/graph-image.tsx` (`GraphImage`: white background, title, arrow marker, edges with dash and label boxes, nodes with circle, icon, badge and label, light palette, system font stack) and `render-graph-svg.ts` (`renderGraphSvg` with `createRoot` + `flushSync` + `XMLSerializer`, bounds with 32 px margin, injectable `measureText`); verify `render-graph-svg.test.tsx` covers the spec scenarios "Unlabelled entity", "Hypothetical and verified entities", "Graded entity", "Long label", "Directed hypothetical relation", "Graded relation", "Relation without label nor grade", and that every node lies within the viewBox with at least 32 px margin
- [x] 2.2 Verify in the same test file the "Self-contained vector SVG" scenarios: a `<script>alert(1)</script>` label yields no `script` element and the text is present, and the output contains no `foreignObject`, no `image` element, no `href` to a URL and no `on*` attribute
- [x] 2.3 Verify the export's circle centres and edge endpoints equal `circleCenter` / `edgeSegment` for a two-entity graph, so canvas and export stay aligned
- [x] 2.4 Add the browser `measureText` (cached 2D context with the export font, estimate fallback when no canvas); verify a unit test that it falls back to the estimate in jsdom

## 3. PNG and toolbar menu – `feat(graph-export): export the graph as PNG or SVG from the graph view`

- [x] 3.1 Add `pngSize(width, height, scale)` (with `PNG_SCALES` and `DEFAULT_PNG_SCALE`) and `svgToPng(svg, width, height, scale)` in `src/features/graph-export/png.ts`; rasterised at the PNG size through `sizedSvg`; verify `png.test.ts` for 1,200 × 800 at 4× → 4,800 × 3,200, at 1× → 1,200 × 800, at 8× → 5,016 × 3,344 limited, `sizedSvg` keeping the viewBox and content, 20,000 × 1,000 → 16,384 × 819, a square graph hitting the 16,777,216 px area cap, and `svgToPng` rejecting when the image fails to load or `toBlob` yields `null` (mocked `Image` and canvas)
- [x] 3.2 Replace the graph view's "Exporter" button with `ExportMenu` (`src/features/graph-export/export-menu.tsx`: same outline "Exporter" trigger with `FileDown`, items "JSON" → `onExportJson`, "PNG", "SVG" disabled without entities, `downloadBlob(safeFilename(name, ext), blob)`, `toast.error('Impossible d’exporter l’image')` on failure) and wire "JSON" to the existing flush + export in `investigation-page.tsx`; verify `export-menu.test.tsx`: "JSON" calls `onExportJson`, "PNG"/"SVG" disabled on an empty graph ("JSON" enabled) and enabled after `addEntity`, "SVG" downloads `Opération-Fil-Rouge.svg` with `image/svg+xml` and unsaved edits, a failing PNG shows the toast and downloads nothing
- [x] 3.3 Add `PngExportDialog` (shadcn `RadioGroup` "Échelle", added with `bunx shadcn@latest add radio-group`: 1×, 2×, "4× (recommandé)" selected, 8×, each with its size and "(limitée)" when capped; "Annuler" / "Exporter", the latter focused on opening; state reset on each opening) and open it from "PNG" in `ExportMenu`; verify `png-export-dialog.test.tsx` ("Exporter" focused on opening, default 4× and sizes for 411 × 336, "(limitée)" at 8× for 1,200 × 800, confirm passes the selected scale, cancel calls nothing) and `export-menu.test.tsx` (PNG opens the dialog, "Exporter" downloads with the selected scale, cancel downloads nothing, reopening shows 4×, failure toast)
- [x] 3.4 Add `tests/e2e/graph-export.spec.ts`: build a graph with 3 entities (one unlabelled, one graded) and 2 relations, zoom in on one entity, select two elements, rename one entity and export SVG before "Enregistré" (filename, all labels and the new label present, no `foreignObject`); export PNG through the dialog at 4× (filename, PNG signature, IHDR size equal to `pngSize` of the SVG size, same bytes with and without selection), then at 1× (IHDR equals the SVG size) and cancel (no download); switch to the dark theme and check through `page.evaluate` that the PNG's corner pixel is white; empty investigation has "PNG"/"SVG" disabled and "JSON" enabled in the "Exporter" menu. Verify `bun run test:e2e` passes against the production build (CSP active)
- [x] 3.5 Add an `exportJson(page)` helper to `tests/e2e/helpers.ts` (open "Exporter", choose "JSON") and use it in `mvp.spec.ts`, `sources.spec.ts` and `assessment.spec.ts`; verify `bun run test:e2e` passes
- [x] 3.6 Check the "Export PNG et SVG du graphe" box in `ROADMAP.md` (v0.2) and verify the full check suite, `bun run test:e2e` included, is green

## Workflow follow-up

- Archive the change (`openspec archive add-graph-export`) after the user has committed the three groups.
