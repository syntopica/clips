import { readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { lockPath } from './lock-path.ts'

/** Removes the lock only when this process owns it, so a crashed-and-restarted
 * run cannot delete a lock another live run reclaimed in between. Never
 * throws: release runs in signal handlers and finally blocks, where a second
 * failure would mask the first. */
export const releaseLock = async (brainRepository: string): Promise<void> => {
  const directory = lockPath(brainRepository)
  try {
    const raw = await readFile(join(directory, 'owner.json'), 'utf8')
    const owner = JSON.parse(raw) as { pid?: number }
    if (owner.pid !== process.pid) return
    await rm(directory, { recursive: true, force: true })
  } catch {
    /* already gone, or unreadable - leave it for the next run's staleness check */
  }
}
