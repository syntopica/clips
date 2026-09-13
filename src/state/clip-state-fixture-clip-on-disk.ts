import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { temporaryDir } from '../testing/temporary-dir.ts'
import { FIXTURE_CLIP_ID } from './clip-state-fixture-clip-id.ts'

/** A clip directory with real bytes, so contentSha256 has something to hash. */
export const clipOnDisk = (): string => {
  const directory = join(temporaryDir('clips-store-'), FIXTURE_CLIP_ID)
  mkdirSync(directory, { recursive: true })
  writeFileSync(join(directory, 'metadata.json'), '{"a":1}')
  writeFileSync(join(directory, 'index.md'), '# t\n')
  return directory
}
