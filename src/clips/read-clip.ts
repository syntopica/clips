import type { ClipBucket } from './clip-bucket.ts'
import { ClipMetadataSchema } from './clip-metadata-schema.ts'
import { ClipStateSchema } from './clip-state-schema.ts'
import type { Clip } from './clip.ts'
import { firstIssuePath } from './first-issue-path.ts'
import { readJsonFile } from './read-json-file.ts'
import type { ThinClip } from './thin-clip.ts'
import { unsupportedSchemaVersionReason } from './unsupported-schema-version-reason.ts'

/** Every failure here returns a ThinClip carrying a reason, never a throw.
 * `clips status` has to describe the whole store including the parts it cannot
 * process, and one corrupt clip must not hide the healthy ones. The fatal
 * UnsupportedClipSchemaError belongs to `clips ingest`, where stopping the run
 * is the correct answer. */
export const readClip = async (
  directory: string,
  bucket: ClipBucket,
): Promise<Clip | ThinClip> => {
  const thin = (reason: string): ThinClip => ({
    kind: 'thin',
    directory,
    bucket,
    reason,
  })

  const metadataRead = await readJsonFile(directory, 'metadata.json')
  if (!metadataRead.ok) return thin(metadataRead.reason)
  const parsed = metadataRead.value

  const versionReason = unsupportedSchemaVersionReason(parsed)
  if (versionReason !== null) return thin(versionReason)

  const metadata = ClipMetadataSchema.safeParse(parsed)
  if (!metadata.success) {
    return thin(
      `metadata.json does not match schema 1: ${firstIssuePath(metadata.error)}`,
    )
  }

  const stateRead = await readJsonFile(directory, 'state.json')
  if (!stateRead.ok) return thin(stateRead.reason)

  const state = ClipStateSchema.safeParse(stateRead.value)
  if (!state.success) {
    return thin(
      `state.json does not match its schema: ${firstIssuePath(state.error)}`,
    )
  }

  return {
    kind: 'clip',
    directory,
    bucket,
    metadata: metadata.data,
    state: state.data,
  }
}
