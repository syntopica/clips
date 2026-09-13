import { EXIT_CODE } from '../cli/exit-code.ts'
import { requeueMatchingClip } from './requeue-matching-clip.ts'
import { runLockedOnClipsRepository } from './run-locked-on-clips-repository.ts'

/** Send a clip escalated by a transport failure back to `pending`.
 *
 * There was no supported way back: the ingest CLI declares work inside
 * `clips/needs-claude/` out of scope, `deriveClipState` returns `needs-claude`
 * for anything in that bucket and `derivedStateAction` maps it to `skip`, so a
 * clip parked by a model that died mid-run was parked as permanently as one
 * parked for sensitivity. Doing it by hand is four steps - rewrite state.json,
 * `git mv` back, stage the rewritten file explicitly because `git mv` keeps the
 * old blob, commit, push - which is four chances to leave the clips repository
 * inconsistent, and none of them have the collision handling `moveClip` has.
 *
 * It reads `failure` rather than requeueing whatever it is handed; see
 * `requeueRefusal` for what that rules out and why.
 *
 * It takes the ingest lock even though it never touches the brain, because it
 * commits to the clips repository and an ingest run doing the same at the same
 * moment is precisely the inconsistency this command exists to remove. */
export const requeue = async (
  brainRepository: string,
  clipsRepository: string,
  filter: string | null,
): Promise<number> => {
  if (filter === null) {
    process.stderr.write('requeue needs --clip <id>\n')
    return EXIT_CODE.fatalLocal
  }
  return runLockedOnClipsRepository(
    brainRepository,
    clipsRepository,
    async () => requeueMatchingClip(clipsRepository, filter),
  )
}
