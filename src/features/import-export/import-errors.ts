import type { ImportError } from '@/domain/export-format'
import type { Messages } from '@/i18n/types'

/** One line for the user, e.g. "entities.3.id : Identifiant dupliqué". */
export function formatImportError(t: Messages, error: ImportError): string {
  const { errors } = t.importExport
  let message: string
  switch (error.code) {
    case 'newerVersion':
      message = errors.newerVersion(Number(error.value))
      break
    case 'tooManyProperties':
      message = errors.tooManyProperties(Number(error.value))
      break
    case 'more':
      message = errors.more(Number(error.value))
      break
    case 'schema':
      // Already worded by the validator, in the language set on it.
      message = String(error.value)
      break
    default:
      message = errors[error.code]
  }
  return error.path ? `${error.path} : ${message}` : message
}
