import { hostname } from 'node:os'
import type { LockOwner } from './lock-owner.ts'
import { processStartTime } from './process-start-time.ts'

/** Null when the lock is genuinely held; otherwise why it is safe to reclaim.
 * Reclaiming requires the pid and the recorded start time to fail to match a
 * live process together - a pid alone can collide through reuse (SPEC:559-561).
 * A different hostname is never stale: this CLI cannot see that machine's
 * process table, so it must assume the run is live. */
export const staleLockReason = async (
  owner: LockOwner,
): Promise<string | null> => {
  if (owner.hostname !== hostname()) return null
  const started = await processStartTime(owner.pid)
  if (started === null) return `pid ${String(owner.pid)} is not running`
  if (started !== owner.processStartTime)
    return `pid ${String(owner.pid)} was reused by a different process`
  return null
}
