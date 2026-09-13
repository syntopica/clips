import { runGit } from '../git/run-git.ts'
import { splitNul } from '../git/split-nul.ts'
import type { PreflightResult } from './preflight-result.ts'

/** Refuse an ingest while `clips/pending/` holds untracked clips.
 *
 * `clips harvest --promote` leaves new clips untracked, and the pipeline's
 * pending-to-processed `git mv` dies on an untracked source ("source directory
 * is empty") - after the wiki commit has already landed, leaving the clip
 * half-moved for `reconciliation-pending` to recover on the next run. Hit in
 * batch 6 and again on 2026-08-18 despite the runbook line, so the lesson is
 * enforced here instead of remembered. Same shape as `preflightRepository`:
 * check before anything is written, and name the fix. */
export const preflightPendingClips = async (
  clipsRepository: string,
): Promise<PreflightResult> => {
  const result = await runGit(clipsRepository, [
    'ls-files',
    '--others',
    '--exclude-standard',
    '-z',
    'clips/pending',
  ])
  const untracked = splitNul(result.stdout).filter((path) => path !== '')
  if (untracked.length === 0) return { ok: true }
  return {
    ok: false,
    reason:
      `${clipsRepository} holds ${String(untracked.length)} untracked file(s) under clips/pending ` +
      `(${untracked[0] ?? ''}${untracked.length > 1 ? ', ...' : ''}); ` +
      'commit and push them first: git -C ' +
      clipsRepository +
      ' add clips/pending && git -C ' +
      clipsRepository +
      ' commit -m "clips: pending from harvest" && git -C ' +
      clipsRepository +
      ' push',
  }
}
