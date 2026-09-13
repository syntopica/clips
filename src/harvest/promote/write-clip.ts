import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ClipMetadata } from '../../clips/clip-metadata.ts'
import { buildFrontmatter } from './build-frontmatter.ts'
import { clipDirectoryName } from './clip-directory-name.ts'

/** Write one clip directory into `clips/pending/YYYY/MM/`, in the layout
 * `discoverClips` walks and `readClip` validates.
 *
 * `state.json` is written last and is the only mutable file of the four, so a
 * crash mid-write leaves a directory the pipeline treats as incomplete rather
 * than one it treats as ready.
 * SPEC: docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md */
export const writeClip = (
  clipsRepository: string,
  metadata: ClipMetadata,
  body: string,
  sourceHtml: string,
): string => {
  const date = metadata.clipped_at.slice(0, 10)
  const [year, month] = [date.slice(0, 4), date.slice(5, 7)]
  const name = clipDirectoryName(
    date,
    metadata.site,
    metadata.title,
    metadata.clip_id,
  )
  const directory = join(clipsRepository, 'clips', 'pending', year, month, name)
  mkdirSync(directory, { recursive: true })
  writeFileSync(
    join(directory, 'metadata.json'),
    `${JSON.stringify(metadata, null, 2)}\n`,
    'utf8',
  )
  writeFileSync(
    join(directory, 'index.md'),
    `${buildFrontmatter(metadata)}\n${body}\n`,
    'utf8',
  )
  writeFileSync(join(directory, 'source.html'), sourceHtml, 'utf8')
  writeFileSync(
    join(directory, 'state.json'),
    `${JSON.stringify({ status: 'pending', updatedAt: metadata.clipped_at, failure: null, brainCommit: null }, null, 2)}\n`,
    'utf8',
  )
  return directory
}
