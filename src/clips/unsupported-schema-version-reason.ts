import { SUPPORTED_SCHEMA_VERSIONS } from './supported-schema-versions.ts'

/** Null when `parsed.schema_version` is one this CLI knows how to read;
 * otherwise the UNSUPPORTED_CLIP_SCHEMA reason `readClip` reports. A parsed
 * value that is not a JSON object (`null`, an array, a string, ...) gets its
 * own reason rather than the misleading "declares version undefined". */
export const unsupportedSchemaVersionReason = (
  parsed: unknown,
): string | null => {
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))
    return 'metadata.json is not a JSON object'

  const version = (parsed as { schema_version?: unknown }).schema_version
  if (
    typeof version === 'number' &&
    SUPPORTED_SCHEMA_VERSIONS.includes(version)
  )
    return null
  return `UNSUPPORTED_CLIP_SCHEMA: metadata.json declares version ${String(version)}`
}
