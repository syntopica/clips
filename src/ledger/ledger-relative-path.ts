import { posix } from 'node:path'
import { currentWikiLayout } from '../layout/current-wiki-layout.ts'

/** Repository-relative, forward slashes, because git takes it as a pathspec
 * (`cat-file -e origin/main:<path>`) as well as the filesystem. One definition
 * so the two spellings cannot drift apart. Under the instance's `brain.ledger`,
 * which is `.ingest` at the root of a flat wiki and `brain/.ingest` where the
 * pages live in a subdirectory. */
export const ledgerRelativePath = (clipId: string): string =>
  posix.join(currentWikiLayout().ledger, 'clips', `${clipId}.json`)
