import { fastForward } from '../git/fast-forward.ts'
import { fetchOrigin } from '../git/fetch-origin.ts'
import { runGit } from '../git/run-git.ts'

/** Push the clips repository's main, and when the remote advanced re-fetch,
 * rewind the local commit, fast-forward, and let the caller re-apply the
 * deterministic move - at most twice (SPEC:429-433). The rewind is safe
 * exactly because the caller's operation is deterministic and idempotent.
 * Returns true when pushed; false means the caller should re-apply and call
 * again. */
export const pushClipsRepository = async (
  clipsRepository: string,
): Promise<boolean> => {
  const push = await runGit(clipsRepository, ['push', 'origin', 'main'])
  if (push.exitCode === 0) return true
  const reset = await runGit(clipsRepository, ['reset', '--hard', 'HEAD~1'])
  if (reset.exitCode !== 0)
    throw new Error(
      `push rejected and the local commit cannot be rewound: ${reset.stderr.trim()}`,
    )
  await fetchOrigin(clipsRepository)
  await fastForward(clipsRepository, 'origin/main')
  return false
}
