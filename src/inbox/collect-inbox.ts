import { EXIT_CODE } from '../cli/exit-code.ts'
import { archivedClipNames } from './archived-clip-names.ts'
import { collectCommitMessage } from './collect-commit-message.ts'
import { commitAndPushUntilSettled } from './commit-and-push-until-settled.ts'
import { copyClipsIntoArchive } from './copy-clips-into-archive.ts'
import { handOverCommitMessage } from './hand-over-commit-message.ts'
import { inboxPendingClips } from './inbox-pending-clips.ts'
import { partitionInboxClips } from './partition-inbox-clips.ts'
import { removeClipsFromInbox } from './remove-clips-from-inbox.ts'

/** Hand the inbox's pending clips to the archive, in the only order that never
 * loses one: copy and push into the archive first, remove from the inbox
 * second. A crash between the two leaves duplicates, which the next run
 * recognises by directory name and removes without copying. */
export const collectInbox = async (
  inbox: string,
  clipsRepository: string,
): Promise<number> => {
  const { fresh, duplicates } = partitionInboxClips(
    await inboxPendingClips(inbox),
    await archivedClipNames(clipsRepository),
  )
  if (fresh.length > 0)
    await commitAndPushUntilSettled(
      clipsRepository,
      collectCommitMessage(fresh.length),
      async () => copyClipsIntoArchive(inbox, clipsRepository, fresh),
    )
  const handed = [...fresh, ...duplicates]
  if (handed.length > 0)
    await commitAndPushUntilSettled(
      inbox,
      handOverCommitMessage(handed.length),
      async () => removeClipsFromInbox(inbox, handed),
    )
  process.stdout.write(
    `collected ${String(fresh.length)} clips into the archive, ${String(duplicates.length)} already archived; inbox empty\n`,
  )
  return EXIT_CODE.success
}
