import { z } from 'zod'

/**
 * What the graph view shows. A preference of the device, not investigation data: a missing field
 * means "shown", so options added later never reset what the user already chose.
 */
export const displayOptionsSchema = z.object({
  entityLabels: z.boolean().catch(true).default(true),
  relationLabels: z.boolean().catch(true).default(true),
  ratings: z.boolean().catch(true).default(true),
  importantMark: z.boolean().catch(true).default(true),
  minimap: z.boolean().catch(true).default(true),
})

export type DisplayOptions = z.infer<typeof displayOptionsSchema>
export type DisplayOption = keyof DisplayOptions

export const DEFAULT_DISPLAY: DisplayOptions = {
  entityLabels: true,
  relationLabels: true,
  ratings: true,
  importantMark: true,
  minimap: true,
}

/** The options listed in the "Affichage" menu. */
export const MENU_OPTIONS = ['entityLabels', 'relationLabels', 'ratings', 'importantMark'] as const

/**
 * Every option of the "Affichage" menu is shown. The mini-map is not one of them: it has its own
 * button, no indicator and no reset.
 */
export function isDefaultDisplay(options: DisplayOptions): boolean {
  return MENU_OPTIONS.every((key) => options[key])
}

/** The defaults of the "Affichage" menu, leaving the mini-map as it is. */
export function resetMenuOptions(options: DisplayOptions): DisplayOptions {
  return { ...DEFAULT_DISPLAY, minimap: options.minimap }
}
