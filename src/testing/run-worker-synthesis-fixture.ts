import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { SynthesisResult } from '../synthesis/synthesis-result.ts'
import type { WorkerSynthesisPort } from '../worker-synthesis/worker-synthesis-port.ts'
import { workerSynthesizer } from '../worker-synthesis/worker-synthesizer.ts'
import { temporaryDir } from './temporary-dir.ts'

/** Synthesize one clip against a flat fixture worktree holding an index and
 * two pages, `topics/a.md` ("old a") and `topics/c.md` ("old c"). */
export const runWorkerSynthesisFixture = async (
  port: WorkerSynthesisPort,
  guidance = '',
): Promise<{ result: SynthesisResult; worktree: string }> => {
  const clip = temporaryDir('worker-clip-')
  writeFileSync(join(clip, 'index.md'), '---\nurl: https://x\n---\nBody.\n')
  const worktree = temporaryDir('worker-wt-')
  mkdirSync(join(worktree, 'topics'))
  writeFileSync(join(worktree, 'index.md'), '- [[topics/a]] - about a\n')
  writeFileSync(join(worktree, 'topics', 'a.md'), 'old a\n')
  writeFileSync(join(worktree, 'topics', 'c.md'), 'old c\n')
  const result = await workerSynthesizer(port, () => '2026-09-30').synthesize({
    clipDirectory: clip,
    worktree,
    guidance,
  })
  return { result, worktree }
}
