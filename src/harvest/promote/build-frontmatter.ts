import type { ClipMetadata } from '../../clips/clip-metadata.ts'
import { yamlScalar } from './yaml-scalar.ts'

/** Emit the clip's metadata as YAML frontmatter, key order preserved.
 *
 * A hand-rolled emitter rather than js-yaml because the shape is fixed and
 * fully known - `ClipMetadataSchema` is scalars and string arrays, nothing
 * else - and this package keeps exactly one runtime dependency. It is not a
 * general YAML writer and must not be used as one. */
export const buildFrontmatter = (metadata: ClipMetadata): string => {
  const lines = Object.entries(metadata).map(([key, value]) => {
    if (Array.isArray(value)) {
      if (value.length === 0) return `${key}: []`
      return `${key}:\n${value.map((item: string) => `  - ${yamlScalar(item)}`).join('\n')}`
    }
    return `${key}: ${yamlScalar(value as string | number | boolean | null)}`
  })
  return `---\n${lines.join('\n')}\n---\n`
}
