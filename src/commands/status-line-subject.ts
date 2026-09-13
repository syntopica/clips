import { basename } from 'node:path'
import type { Clip } from '../clips/clip.ts'
import type { ThinClip } from '../clips/thin-clip.ts'

/** Everything a status line says about a clip, as one string. Every part of it
 * is page-derived - a thin clip's directory slug is built from the page title -
 * so the parts are assembled first and sanitized once by the caller. Sanitizing
 * field by field is how metadata.site and basename(clip.directory) reached the
 * terminal unfiltered. */
export const statusLineSubject = (clip: Clip | ThinClip): string =>
  clip.kind === 'thin'
    ? basename(clip.directory)
    : `${clip.metadata.clip_id.slice(0, 8)} ${clip.metadata.site} ${clip.metadata.title}`
