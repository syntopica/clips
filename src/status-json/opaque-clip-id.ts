import { basename } from 'node:path'
import type { Clip } from '../clips/clip.ts'
import type { ThinClip } from '../clips/thin-clip.ts'
import { sha256Hex } from '../harvest/promote/sha256-hex.ts'

/** Sixteen hex characters of a sha256 over the clip id, or over the directory
 * name of a clip that has none: stable while the clip exists, and not the id
 * itself, which the counts document has always kept out (orbit design 6.6). */
export const opaqueClipId = (clip: Clip | ThinClip): string =>
  sha256Hex(
    clip.kind === 'clip'
      ? `clip:${clip.metadata.clip_id}`
      : `thin:${basename(clip.directory)}`,
  ).slice(0, 16)
