import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { clipFileFrame } from './clip-file-frame.ts'
import { IMMUTABLE_CLIP_FILES } from './immutable-clip-files.ts'
import { readFileIfPresent } from './read-file-if-present.ts'

/** source.html is optional - it is omitted when oversized. metadata.json and
 * index.md are not: a clip missing either is not a complete clip and must not
 * receive a digest that looks like one. */
export const contentSha256 = async (clipDirectory: string): Promise<string> => {
  const hash = createHash('sha256')
  for (const name of IMMUTABLE_CLIP_FILES) {
    const bytes = await readFileIfPresent(join(clipDirectory, name))
    if (bytes === null) {
      if (name === 'source.html') continue
      throw new Error(`clip is missing ${name}: ${clipDirectory}`)
    }
    hash.update(clipFileFrame(name, bytes))
  }
  return hash.digest('hex')
}
