import { useState } from 'react'
import { toast } from 'sonner'
import { renderGraphSvg } from '@/features/graph-export/render-graph-svg'
import { svgToPng, type PngScale } from '@/features/graph-export/png'
import { PngExportDialog, type PendingPng } from '@/features/graph-export/png-export-dialog'
import { downloadBlob, safeFilename } from '@/lib/download'
import { useGraphStore } from '@/store/graph-store'

function failed() {
  // The error is not logged: it could echo investigation content.
  toast.error('Impossible d’exporter l’image')
}

/** Draws the open investigation's graph, as it is in memory (unsaved edits included). */
function drawGraph(): PendingPng | null {
  const { investigation, entities, relations } = useGraphStore.getState()
  if (!investigation) return null
  return { name: investigation.name, ...renderGraphSvg({ name: investigation.name, entities, relations }) }
}

function exportSvg() {
  try {
    const drawing = drawGraph()
    if (!drawing) return
    downloadBlob(
      safeFilename(drawing.name, 'svg'),
      new Blob([drawing.svg], { type: 'image/svg+xml;charset=utf-8' }),
    )
  } catch {
    failed()
  }
}

async function exportPng(drawing: PendingPng, scale: PngScale) {
  try {
    const blob = await svgToPng(drawing.svg, drawing.width, drawing.height, scale)
    downloadBlob(safeFilename(drawing.name, 'png'), blob)
  } catch {
    failed()
  }
}

/**
 * The image exports of the open investigation (the whole graph, whatever the current pan and
 * zoom) and the PNG scale dialog they share. JSON is handled by the caller, which owns the
 * screenshot dialog. Both the desktop menu and the compact toolbar menu use it.
 */
export function useGraphExports() {
  const empty = useGraphStore((state) => Object.keys(state.entities).length === 0)
  const [pendingPng, setPendingPng] = useState<PendingPng | null>(null)

  const openPngDialog = () => {
    try {
      setPendingPng(drawGraph())
    } catch {
      failed()
    }
  }

  const pngDialog = (
    <PngExportDialog
      pending={pendingPng}
      onCancel={() => setPendingPng(null)}
      onConfirm={(scale) => {
        if (pendingPng) void exportPng(pendingPng, scale)
        setPendingPng(null)
      }}
    />
  )

  return { empty, exportPng: openPngDialog, exportSvg, pngDialog }
}
