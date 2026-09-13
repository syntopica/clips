import { clipMetadata } from './ingest-test-clip-metadata.ts'
import { CLIP_RELATIVE } from './ingest-test-clip-relative.ts'
import { INGEST_TEST_DATA_CONFIG } from './ingest-test-data-config.ts'
import { INDEX_BUILDER_FILES } from './ingest-test-index-builder.ts'
import { pendingState } from './ingest-test-pending-state.ts'
import { repositoryWithOrigin } from './ingest-test-repository-with-origin.ts'
import { INGEST_TEST_SCHEMA_FILE } from './ingest-test-schema-file.ts'

/** A brain and a clips repository, both clean on main == origin/main, with one
 * pending clip. */
export const fixture = (
  sensitivity = 'public',
): { brain: string; clips: string; brainOrigin: string } => {
  const brain = repositoryWithOrigin('ing-brain', {
    'index.md': '# brain\n',
    ...INDEX_BUILDER_FILES,
    ...INGEST_TEST_SCHEMA_FILE,
    ...INGEST_TEST_DATA_CONFIG,
    // A committed page pointing at the page the scripted synthesizer writes:
    // validation refuses a new page nothing links to, and a line in index.md
    // does not count as a link.
    'topics/hub.md': '# Hub\n\nSee [[topics/test-topic]].\n',
    // Mirrors the real brain repo: the lock lives inside the repository, so
    // it must be ignored or holding it would fail every preflight.
    '.gitignore': '.ingest/lock/\n',
  })
  const clips = repositoryWithOrigin('ing-clips', {
    [`${CLIP_RELATIVE}/metadata.json`]: clipMetadata(sensitivity),
    [`${CLIP_RELATIVE}/state.json`]: pendingState,
    [`${CLIP_RELATIVE}/index.md`]: '# t\n',
  })
  return { brain: brain.clone, clips: clips.clone, brainOrigin: brain.origin }
}
