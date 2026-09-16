import { drainLimit } from '../capture/drain-limit.ts'
import { audit } from '../commands/audit.ts'
import { drain } from '../commands/drain.ts'
import { harvest } from '../commands/harvest.ts'
import { pull } from '../commands/pull.ts'
import { reconcile } from '../commands/reconcile.ts'
import type { Repositories } from '../commands/repositories.ts'
import { requeue } from '../commands/requeue.ts'
import type { CliArguments } from './cli-arguments.ts'

/** Commands that write outside the ingest lock, plus pull, requeue and
 * reconcile which take their own: pull, requeue, reconcile, drain, audit,
 * harvest. Returns null when
 * `args` names none of them, so runCli falls through to ingest, the
 * default. */
export const runUnlockedWriteCommand = async (
  args: CliArguments,
  repositories: Repositories,
): Promise<number | null> => {
  // Pull commits collected clips to the archive, so it takes the ingest lock
  // for that half; the inbox fetch before it is the old read-only pull.
  if (args.command === 'pull')
    return pull(repositories.brain, repositories.clips)
  // Requeue writes to the clips repository, so it takes the ingest lock; it
  // is otherwise the smallest command here, one move and a push.
  if (args.command === 'requeue')
    return requeue(repositories.brain, repositories.clips, args.clip)
  // Reconcile commits to both repositories, so like ingest it takes the lock;
  // no model ever runs, it is bookkeeping over what the wiki already cites.
  if (args.command === 'reconcile')
    return reconcile(repositories.brain, repositories.clips, {
      cited: args.cited,
      dryRun: args.dryRun,
    })
  // Drain reaches the capture service and writes clip directories, but it
  // commits nothing and pushes nothing, so it stays outside the ingest lock
  // exactly as `harvest --promote` does for the same writes.
  if (args.command === 'drain')
    return drain(repositories.clips, drainLimit(args.limit), args.dryRun)
  // Audit spends no quota at all, so unlike grade it can run over the whole
  // wiki on every batch rather than over the pages one batch touched.
  if (args.command === 'audit')
    return audit(repositories.brain, repositories.clips)
  // Harvest reads mail and writes only to the gitignored inbox drop zone, so
  // it stays outside the ingest lock like the other read-mostly commands.
  if (args.command === 'harvest')
    return harvest(repositories.brain, repositories.clips, {
      source: args.source,
      dryRun: args.dryRun,
      promote: args.promote,
      captureAll: args.captureAll,
      date: args.date,
      since: args.since,
    })
  return null
}
