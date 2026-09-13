/** SPEC:547-561. `processStartTime` exists because a pid alone can collide
 * through reuse: reclaiming requires both the pid and the recorded start time
 * to fail to match a live process. */
export type LockOwner = {
  pid: number
  hostname: string
  startedAt: string
  processStartTime: string
  command: string
}
