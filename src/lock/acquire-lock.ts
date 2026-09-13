import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { hostname } from 'node:os'
import { join } from 'node:path'
import { JSON_PARSE_FAILED } from '../clips/json-parse-failed.ts'
import { parseJson } from '../clips/parse-json.ts'
import { LockHeldError } from './lock-held-error.ts'
import type { LockOwner } from './lock-owner.ts'
import { lockPath } from './lock-path.ts'
import { processStartTime } from './process-start-time.ts'
import { staleLockReason } from './stale-lock-reason.ts'

/** Atomic `mkdir` is the acquisition; owner.json is written after, so a lock
 * directory with an unreadable owner file is treated as held - reclaiming on
 * a parse failure would race the writer between its mkdir and its write. One
 * reclaim attempt only: if the retry also finds the directory, someone else
 * won the race and that is a genuine hold. */
export const acquireLock = async (brainRepository: string): Promise<void> => {
  const directory = lockPath(brainRepository)
  await mkdir(join(brainRepository, '.ingest'), { recursive: true })
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await mkdir(directory)
      const owner: LockOwner = {
        pid: process.pid,
        hostname: hostname(),
        startedAt: new Date().toISOString(),
        processStartTime: (await processStartTime(process.pid)) ?? 'unknown',
        command: 'clips ingest',
      }
      await writeFile(join(directory, 'owner.json'), JSON.stringify(owner))
      return
    } catch (error) {
      if ((error as { code?: string }).code !== 'EEXIST') throw error
      const raw = await readFile(join(directory, 'owner.json')).catch(
        () => null,
      )
      const parsed = raw === null ? JSON_PARSE_FAILED : parseJson(raw)
      if (parsed === JSON_PARSE_FAILED)
        throw new LockHeldError(`${directory} exists with no readable owner`)
      const reason = await staleLockReason(parsed as LockOwner)
      if (reason === null)
        throw new LockHeldError(
          `held by pid ${String((parsed as LockOwner).pid)} on ${(parsed as LockOwner).hostname}`,
        )
      await rm(directory, { recursive: true, force: true })
    }
  }
  throw new LockHeldError('lost the reclaim race twice')
}
