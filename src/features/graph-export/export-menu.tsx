import { FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useGraphExports } from '@/features/graph-export/use-graph-exports'

/** Every export of the open investigation: JSON and images of the whole graph. */
export function ExportMenu({ onExportJson }: { onExportJson: () => void }) {
  const { empty, exportPng: openPngDialog, exportSvg: saveSvg, pngDialog } = useGraphExports()

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <FileDown /> Exporter
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onExportJson}>JSON</DropdownMenuItem>
          <DropdownMenuItem disabled={empty} onSelect={openPngDialog}>
            PNG
          </DropdownMenuItem>
          <DropdownMenuItem disabled={empty} onSelect={saveSvg}>
            SVG
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {pngDialog}
    </>
  )
}
