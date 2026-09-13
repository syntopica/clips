import { spawn } from 'node:child_process'

import type { Boundary } from './boundary.ts'
import type { ProbeCommandResult } from './probe-command-result.ts'

/**
 * Runs one probe command and reports how the child process itself ended.
 *
 * The environment is replaced, never merged: a probe that inherited the
 * caller's environment would carry in the very credentials the boundary is
 * supposed to keep out.
 */
export async function runProbeCommand(
  command: string[],
  boundary: Boundary,
  timeoutMs: number,
): Promise<ProbeCommandResult> {
  const { argv, env } = boundary(command)
  const [executable, ...args] = argv
  if (executable === undefined)
    throw new Error('boundary produced an empty argv')

  return new Promise((resolve) => {
    const child = spawn(executable, args, {
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    let timedOut = false

    const timer = setTimeout(() => {
      timedOut = true
      child.kill('SIGKILL')
    }, timeoutMs)

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8')
    })
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8')
    })

    // A spawn failure emits `error` and then `close`, so `resolve` is called
    // twice and the second call is a no-op. That is intended: whichever fires
    // first carries the same accumulated stdio. Do not "fix" this into a
    // once-guard - doing so changes which values win.
    child.on('error', (error: Error) => {
      clearTimeout(timer)
      resolve({
        exitCode: null,
        signal: null,
        stdout,
        stderr: `${stderr}${error.message}`,
        timedOut,
      })
    })

    child.on('close', (code, signal) => {
      clearTimeout(timer)
      resolve({ exitCode: code, signal, stdout, stderr, timedOut })
    })
  })
}
