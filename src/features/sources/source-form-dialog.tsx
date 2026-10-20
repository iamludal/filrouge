import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { findDuplicateSource } from '@/domain/graph'
import { LIMITS, type Attachment, type Source } from '@/domain/schemas'
import { fromLocalInput, toLocalInput, validateSourceForm, type SourceFormErrors } from '@/domain/sources'
import { useSourceName } from '@/features/sources/use-source-name'
import { useI18n } from '@/i18n/locale'
import { canOptimize, optimizeAttachment } from '@/features/sources/optimize-image'
import { ScreenshotField } from '@/features/sources/screenshot-field'
import { intakeScreenshot, type ScreenshotError } from '@/features/sources/screenshot'
import { useStoredAttachment } from '@/features/sources/use-attachment'
import { nowIso } from '@/lib/ids'
import { useGraphStore, type ElementRef } from '@/store/graph-store'

interface SourceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The source to edit; a new one is created when absent. */
  source?: Source
  /** Element a new source is attached to once saved. */
  attachTo?: ElementRef
  /** A screenshot to start from, e.g. an image pasted on the graph. */
  initialFile?: Blob
  onSaved?: (source: Source) => void
}

export function SourceFormDialog(props: SourceFormDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {/* Radix unmounts closed content, so the form state resets on each opening. */}
        <SourceFormHost {...props} />
      </DialogContent>
    </Dialog>
  )
}

/** Owns which source the form edits, so a duplicate warning can switch to the existing one. */
function SourceFormHost(props: SourceFormDialogProps) {
  const [editing, setEditing] = useState(props.source)
  return (
    <SourceForm
      key={editing?.id ?? 'new'}
      {...props}
      source={editing}
      initialFile={editing === props.source ? props.initialFile : undefined}
      onOpenExisting={setEditing}
    />
  )
}

function SourceForm({
  onOpenChange,
  source,
  attachTo,
  initialFile,
  onSaved,
  onOpenExisting,
}: SourceFormDialogProps & { onOpenExisting: (source: Source) => void }) {
  const { t } = useI18n()
  const sourceName = useSourceName()
  const investigationId = useGraphStore((state) => state.investigation?.id)
  const createSource = useGraphStore((state) => state.createSource)
  const updateSource = useGraphStore((state) => state.updateSource)
  const setSourceAttachment = useGraphStore((state) => state.setSourceAttachment)
  const attachSource = useGraphStore((state) => state.attachSource)
  const sources = useGraphStore((state) => state.sources)

  const [title, setTitle] = useState(source?.title ?? '')
  const [url, setUrl] = useState(source?.url ?? '')
  const [archiveUrl, setArchiveUrl] = useState(source?.archiveUrl ?? '')
  const [capturedAt, setCapturedAt] = useState(toLocalInput(source?.capturedAt ?? nowIso()))
  const [note, setNote] = useState(source?.note ?? '')
  // undefined: screenshot unchanged; null: removed; an Attachment: the file just added.
  const [intake, setIntake] = useState<Attachment | null | undefined>(undefined)
  const [optimizeOn, setOptimizeOn] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [optimized, setOptimized] = useState<Attachment | null>(null)
  const [optimizeNotice, setOptimizeNotice] = useState<'no-gain' | 'unavailable' | null>(null)
  const [ignoredDuplicate, setIgnoredDuplicate] = useState<string | null>(null)
  const [screenshotError, setScreenshotError] = useState<ScreenshotError | null>(null)
  const [errors, setErrors] = useState<SourceFormErrors>({})

  // What gets saved: the optimized image when the option is on, else the file as added.
  const pending = intake && optimizeOn && optimized ? optimized : intake
  const unchanged = pending === undefined
  const stored = useStoredAttachment(unchanged ? source?.attachmentId : undefined)
  const attachment = unchanged ? stored : (pending ?? undefined)
  const hasScreenshot = unchanged ? Boolean(source?.attachmentId) : pending !== null
  const sha256 = attachment?.sha256 ?? (unchanged ? source?.sha256 : undefined)

  const ingest = async (file: Blob) => {
    if (!investigationId) return
    const result = await intakeScreenshot(file, investigationId)
    if (result.ok) {
      setScreenshotError(null)
      setIntake(result.attachment)
      setOptimizeOn(false)
      setOptimized(null)
      setOptimizeNotice(null)
      setIgnoredDuplicate(null)
    } else {
      setScreenshotError(result.error)
    }
  }

  const intakeId = useRef<string>(undefined)
  useEffect(() => {
    intakeId.current = intake ? intake.id : undefined
  }, [intake])

  const toggleOptimize = async (checked: boolean) => {
    setOptimizeNotice(null)
    if (!checked || !intake) {
      setOptimizeOn(false)
      return
    }
    setOptimizing(true)
    const result = await optimizeAttachment(intake)
    setOptimizing(false)
    if (intakeId.current !== intake.id) return // Another file was added meanwhile.
    if (result.ok) {
      setOptimized(result.attachment)
      setOptimizeOn(true)
    } else {
      setOptimizeNotice(result.reason)
    }
  }

  const duplicate = intake
    ? findDuplicateSource(Object.values(sources), intake.sha256, source?.id)
    : undefined
  const showDuplicate = duplicate && ignoredDuplicate !== intake?.sha256

  const started = useRef(false)
  useEffect(() => {
    if (initialFile && !started.current) {
      started.current = true
      void ingest(initialFile)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once, on mount
  }, [])

  const handlePaste = (event: ClipboardEvent) => {
    const image = [...event.clipboardData.files].find((file) => file.type.startsWith('image/'))
    if (!image) return // Text pastes keep their usual behavior.
    event.preventDefault()
    void ingest(image)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const found = validateSourceForm({ title, url, archiveUrl, capturedAt, note }, hasScreenshot)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    const fields = {
      title: title.trim() || undefined,
      url: url.trim() || undefined,
      archiveUrl: archiveUrl.trim() || undefined,
      note: note || undefined,
      capturedAt: fromLocalInput(capturedAt)!,
    }
    let saved: Source | null | undefined
    if (source) {
      updateSource(source.id, fields)
      if (pending !== undefined) setSourceAttachment(source.id, pending)
      saved = useGraphStore.getState().sources[source.id]
    } else {
      saved = createSource(fields, pending ?? undefined, attachTo)
    }
    if (saved) onSaved?.(saved)
    onOpenChange(false)
  }

  return (
    <form onSubmit={handleSubmit} onPaste={handlePaste} className="grid gap-4" noValidate>
      <DialogHeader>
        <DialogTitle>{source ? t.sources.form.editTitle : t.sources.form.newTitle}</DialogTitle>
        <DialogDescription>{t.sources.form.description}</DialogDescription>
      </DialogHeader>
      <Field id="source-title" label={t.sources.form.title}>
        <Input
          id="source-title"
          value={title}
          maxLength={LIMITS.label}
          onChange={(event) => setTitle(event.target.value)}
          autoFocus
        />
      </Field>
      <Field id="source-url" label={t.sources.form.url} error={errors.url && t.sources.errors[errors.url]}>
        <Input
          id="source-url"
          value={url}
          maxLength={LIMITS.url}
          inputMode="url"
          aria-invalid={Boolean(errors.url)}
          onChange={(event) => setUrl(event.target.value)}
        />
      </Field>
      <Field
        id="source-archive"
        label={t.sources.form.archive}
        error={errors.archiveUrl && t.sources.errors[errors.archiveUrl]}
      >
        <Input
          id="source-archive"
          value={archiveUrl}
          maxLength={LIMITS.url}
          inputMode="url"
          aria-invalid={Boolean(errors.archiveUrl)}
          onChange={(event) => setArchiveUrl(event.target.value)}
        />
      </Field>
      <Field
        id="source-captured"
        label={t.sources.form.capturedAt}
        error={errors.capturedAt && t.sources.errors[errors.capturedAt]}
      >
        <Input
          id="source-captured"
          type="datetime-local"
          value={capturedAt}
          onChange={(event) => setCapturedAt(event.target.value)}
        />
      </Field>
      <Field id="source-note" label={t.sources.form.note}>
        <Textarea
          id="source-note"
          value={note}
          maxLength={LIMITS.text}
          rows={3}
          onChange={(event) => setNote(event.target.value)}
        />
      </Field>
      <ScreenshotField
        attachment={attachment}
        hasScreenshot={hasScreenshot}
        sha256={sha256}
        originalSha256={attachment?.originalSha256 ?? (unchanged ? source?.originalSha256 : undefined)}
        optimization={
          intake && canOptimize(intake)
            ? {
                checked: optimizeOn,
                busy: optimizing,
                originalSize: intake.size,
                optimizedSize: optimized?.size,
                notice: optimizeNotice,
                onToggle: (checked) => void toggleOptimize(checked),
              }
            : undefined
        }
        error={screenshotError}
        onFile={(file) => void ingest(file)}
        onRemove={() => {
          setScreenshotError(null)
          setIntake(null)
          setOptimizeOn(false)
          setOptimized(null)
          setOptimizeNotice(null)
        }}
      />
      {showDuplicate && (
        <div role="alert" className="grid gap-2 rounded-md border border-amber-500 p-3 text-sm">
          <p>{t.sources.form.duplicate(sourceName(duplicate))}</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenExisting(duplicate)}>
              {t.sources.form.openExisting}
            </Button>
            {attachTo && !source && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  attachSource(attachTo, duplicate.id)
                  onOpenChange(false)
                }}
              >
                {t.sources.form.attachExisting}
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIgnoredDuplicate(intake?.sha256 ?? null)}
            >
              {t.sources.form.addAnyway}
            </Button>
          </div>
        </div>
      )}
      {errors.form && (
        <p role="alert" className="text-sm text-destructive">
          {t.sources.errors[errors.form]}
        </p>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          {t.common.cancel}
        </Button>
        <Button type="submit">{t.common.save}</Button>
      </DialogFooter>
    </form>
  )
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
