import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

/** The start time of a live process, or null when no such process exists.
 * `ps -o lstart=` prints a locale-independent fixed-width date under LC_ALL=C
 * and exits 1 for a dead pid, which is the whole liveness answer: a lock whose
 * pid is dead needs no start-time comparison at all. */
export const processStartTime = async (pid: number): Promise<string | null> => {
  const execFileAsync = promisify(execFile)
  try {
    const { stdout } = await execFileAsync(
      'ps',
      ['-o', 'lstart=', '-p', String(pid)],
      { encoding: 'utf8', env: { ...process.env, LC_ALL: 'C' } },
    )
    const started = stdout.trim()
    return started === '' ? null : started
  } catch {
    return null
  }
}
