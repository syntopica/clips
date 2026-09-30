import { brainEngineDirectory } from './brain-engine-directory.ts'
import { clipMetadata } from './ingest-test-clip-metadata.ts'
import { CLIP_RELATIVE } from './ingest-test-clip-relative.ts'
import { ingestTestDataConfig } from './ingest-test-data-config.ts'
import { ingestTestEngineDirectory } from './ingest-test-engine-directory.ts'
import { pendingState } from './ingest-test-pending-state.ts'
import { repositoryWithOrigin } from './ingest-test-repository-with-origin.ts'

/** A brain and a clips repository, both clean on main == origin/main, with one
 * pending clip. The brain engine is the real checkout beside this one: the
 * index generator and the configuration schema live there, as they do for a
 * real instance, and the pipeline runs the actual generator rather than a stub
 * because publication depends on it. */
export const fixture = (
  sensitivity = 'public',
): { brain: string; clips: string; brainOrigin: string } => {
  const brain = repositoryWithOrigin('ing-brain', {
    'index.md': '# brain\n',
    ...ingestTestDataConfig(
      brainEngineDirectory(),
      ingestTestEngineDirectory(),
    ),
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
