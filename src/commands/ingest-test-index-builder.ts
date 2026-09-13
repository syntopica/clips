import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { INDEX_TOOL_DIRECTORY } from './ingest-test-index-tool-directory.ts'

/** The real index generator, which the pipeline runs inside the worktree as a
 * trusted step. The fixture carries the actual scripts rather than a stub: the
 * step's whole point is that publication depends on it, so a fixture that
 * faked it would test the wiring and not the dependency. `build.py` imports
 * its sibling modules by bare name, so every module of the directory travels
 * with it, keyed by the path it has in the brain. */
export const INDEX_BUILDER_FILES: Record<string, string> = Object.fromEntries(
  readdirSync(INDEX_TOOL_DIRECTORY)
    .filter((name) => name.endsWith('.py'))
    .map((name) => [
      `tools/index/${name}`,
      readFileSync(join(INDEX_TOOL_DIRECTORY, name), 'utf8'),
    ]),
)
