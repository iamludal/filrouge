import type { ToolCheck } from '@/domain/schemas'

/**
 * The checks after checking or unchecking one tool. Checking an already checked tool replaces its
 * date; other tools keep their place. Returns `undefined` when no check is left, so that an entity
 * without checks has no `toolChecks` field at all.
 */
export function withToolCheck(
  checks: readonly ToolCheck[] | undefined,
  toolId: string,
  checked: boolean,
  at: string,
): ToolCheck[] | undefined {
  const current = checks ?? []
  const next = checked
    ? current.some((check) => check.toolId === toolId)
      ? current.map((check) => (check.toolId === toolId ? { toolId, checkedAt: at } : check))
      : [...current, { toolId, checkedAt: at }]
    : current.filter((check) => check.toolId !== toolId)
  return next.length > 0 ? next : undefined
}
