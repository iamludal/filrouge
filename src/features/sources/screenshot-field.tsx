import { Copy, Download, ImagePlus, Trash2 } from 'lucide-react'
import { useRef, useState, type DragEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { LIMITS, type Attachment } from '@/domain/schemas'
import { useI18n } from '@/i18n/locale'
import { ACCEPTED_IMAGES, screenshotFilename, type ScreenshotError } from '@/features/sources/screenshot'
import { useBlobUrl } from '@/features/sources/use-attachment'
import { downloadBlob } from '@/lib/download'

export interface OptimizationState {
  checked: boolean
  busy: boolean
  /** Size of the file as added, and of the optimized one once computed. */
  originalSize: number
  optimizedSize: number | undefined
  /** Why optimizing did nothing, when it did not. */
  notice: 'no-gain' | 'unavailable' | null
  onToggle: (checked: boolean) => void
}

interface ScreenshotFieldProps {
  /** The screenshot to show; undefined while a stored one is still loading or when there is none. */
  attachment: Attachment | undefined
  hasScreenshot: boolean
  /** Fingerprint shown even when the image itself is not loaded (stored on the source). */
  sha256: string | undefined
  /** Fingerprint of the file as added, when the stored screenshot was optimized. */
  originalSha256: string | undefined
  /** Present only when optimizing is offered for the screenshot being added. */
  optimization: OptimizationState | undefined
  error: ScreenshotError | null
  onFile: (file: File) => void
  onRemove: () => void
}

export function ScreenshotField({
  attachment,
  hasScreenshot,
  sha256,
  originalSha256,
  optimization,
  error,
  onFile,
  onRemove,
}: ScreenshotFieldProps) {
  const { t, format } = useI18n()
  const { formatBytes } = format
  const texts = t.sources.screenshot
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [viewing, setViewing] = useState(false)
  const url = useBlobUrl(attachment?.blob)

  const handleDrop = (event: DragEvent) => {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) onFile(file)
  }

  const copyFingerprint = async () => {
    if (!sha256) return
    try {
      await navigator.clipboard.writeText(sha256)
      toast.success(texts.fingerprintCopied)
    } catch {
      toast.error(texts.copyFailed)
    }
  }

  return (
    <div
      className={`grid gap-3 rounded-md border border-dashed p-3 ${dragging ? 'bg-accent' : ''}`}
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      {url && (
        <button
          type="button"
          aria-label={texts.viewLarge}
          className="overflow-hidden rounded border"
          onClick={() => setViewing(true)}
        >
          <img src={url} alt={texts.previewAlt} className="max-h-48 w-full object-contain" />
        </button>
      )}
      {sha256 && (
        <div className="grid gap-1 text-xs">
          <span className="text-muted-foreground uppercase">{texts.sha256}</span>
          <div className="flex items-start gap-2">
            <code className="min-w-0 flex-1 font-mono break-all" data-testid="sha256">
              {sha256}
            </code>
            <Button type="button" variant="outline" size="icon-sm" onClick={copyFingerprint}>
              <Copy />
              <span className="sr-only">{texts.copyFingerprint}</span>
            </Button>
          </div>
        </div>
      )}
      {originalSha256 && (
        <div className="grid gap-1 text-xs">
          <span className="font-medium">{texts.optimizedTitle}</span>
          <span className="text-muted-foreground uppercase">{texts.originalHash}</span>
          <code className="font-mono break-all" data-testid="original-sha256">
            {originalSha256}
          </code>
        </div>
      )}
      {optimization && (
        <div className="grid gap-1 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="size-4"
              checked={optimization.checked}
              disabled={optimization.busy}
              onChange={(event) => optimization.onToggle(event.target.checked)}
            />
            {texts.optimize}
          </label>
          {optimization.busy && <p className="text-xs text-muted-foreground">{texts.optimizing}</p>}
          {optimization.checked && optimization.optimizedSize !== undefined && (
            <p className="text-xs">
              {formatBytes(optimization.originalSize)} → {formatBytes(optimization.optimizedSize)}
            </p>
          )}
          {optimization.checked && <p className="text-xs text-muted-foreground">{texts.exifRemoved}</p>}
          {optimization.notice && (
            <p className="text-xs text-muted-foreground">{t.sources.optimizeNotices[optimization.notice]}</p>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()}>
          <ImagePlus /> {hasScreenshot ? texts.replace : texts.add}
        </Button>
        {attachment && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => downloadBlob(screenshotFilename(attachment), attachment.blob)}
          >
            <Download /> {texts.download}
          </Button>
        )}
        {hasScreenshot && (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 /> {texts.remove}
          </Button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept={ACCEPTED_IMAGES}
        className="hidden"
        aria-hidden
        tabIndex={-1}
        data-testid="screenshot-input"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) onFile(file)
        }}
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error === 'size'
            ? t.sources.screenshotErrors.size(formatBytes(LIMITS.attachmentBytes))
            : t.sources.screenshotErrors[error]}
        </p>
      )}
      <p className="text-xs text-muted-foreground">{texts.dropHint}</p>
      <Dialog open={viewing} onOpenChange={setViewing}>
        <DialogContent className="max-h-[90vh] overflow-auto sm:max-w-4xl">
          <DialogTitle>{texts.dialogTitle}</DialogTitle>
          <DialogDescription className="sr-only">{texts.dialogDescription}</DialogDescription>
          {url && <img src={url} alt={texts.fullAlt} className="mx-auto max-w-full" />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
