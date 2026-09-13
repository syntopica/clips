import { EXIT_CODE } from '../cli/exit-code.ts'
import { discoverClips } from '../clips/discover-clips.ts'
import { requeueClip } from '../reconcile/requeue-clip.ts'
import { requeueRefusal } from '../reconcile/requeue-refusal.ts'
import { singleMatchingClip } from './single-matching-clip.ts'

/** What `clips requeue` does once the lock is held: find the one clip the
 * filter names, ask whether it may go back, and move it.
 *
 * Both refusals exit 1 and write nothing. That is the point of the command -
 * the failure it prevents is a clips repository left half-moved, so a run that
 * declines has to leave no trace at all. */
export const requeueMatchingClip = async (
  clipsRepository: string,
  filter: string,
): Promise<number> => {
  const found = singleMatchingClip(await discoverClips(clipsRepository), filter)
  if (typeof found === 'string') {
    process.stderr.write(`${found}\n`)
    return EXIT_CODE.fatalLocal
  }
  const refusal = requeueRefusal(found)
  if (refusal !== null) {
    process.stderr.write(
      `${found.metadata.clip_id} was not requeued: ${refusal}\n`,
    )
    return EXIT_CODE.fatalLocal
  }
  await requeueClip(clipsRepository, found)
  process.stdout.write(`${found.metadata.clip_id}: requeued to pending\n`)
  return EXIT_CODE.success
}
