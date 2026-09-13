import { SUPPORTED_LEDGER_VERSIONS } from './supported-ledger-versions.ts'

/** Null when the document declares a schemaVersion this CLI reads; otherwise
 * the reason to report. Mirrors unsupportedSchemaVersionReason for clips: a
 * document that is not a JSON object (null, an array, a bare string) gets its
 * own reason instead of the misleading "declares version undefined". */
export const unsupportedLedgerVersionReason = (
  parsed: unknown,
): string | null => {
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))
    return 'the ledger is not a JSON object'

  const version = (parsed as { schemaVersion?: unknown }).schemaVersion
  if (
    typeof version === 'number' &&
    SUPPORTED_LEDGER_VERSIONS.includes(version)
  )
    return null
  return `UNSUPPORTED_LEDGER_SCHEMA: the ledger declares version ${String(version)}`
}
