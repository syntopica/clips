import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { CursorRun } from './cursor-run.ts'

/** Run `cursor-agent` in print mode with the prompt on **stdin**.
 *
 * The prompt does not go in argv, and that is the whole reason this module
 * exists. `cursor-agent` takes the prompt as a positional argument and also
 * reads it from stdin when none is given, and the two are not equivalent at
 * size: measured 2026-09-11 grading `topics/architecture-economics`, whose
 * evidence is 480 KB, an argv prompt made the process exit 0 having written
 * **nothing at all** - no stdout, no stderr, no error. Empty output and success
 * is the worst failure shape available, and it is indistinguishable from a
 * model that declined to answer.
 *
 * `ARG_MAX` on this host is 1048576 and the prompt was under it, so the kernel
 * was never the thing refusing; something inside the CLI gives up quietly
 * somewhere between 400 KB of argv, which answers, and 480 KB, which does not.
 * The same 480 KB down a pipe answers normally, which is what makes the pipe
 * the right channel.
 *
 * **It does not make the pipe unbounded, and this comment said it did for a few
 * hours.** 800 KB on stdin returns an empty stdout with exit 0 - the identical
 * silent shape, just further out - so the limit moved rather than disappeared
 * and `CURSOR_EVIDENCE_CEILING_BYTES` still has to exist. Whatever gives up is
 * inside the CLI, not in the kernel, which is the one thing both measurements
 * agree on. Rather than find that number and encode it as
 * a ceiling, the prompt moves to a pipe, which has no such limit and needs no
 * constant to go stale. It is also why this transport needs no equivalent of
 * `AGY_EVIDENCE_CEILING_BYTES`: the limit that remains is the clock and the
 * model's context, both of which fail loudly.
 *
 * A timeout is delivered as SIGKILL so a hung run cannot outlive its caller,
 * and arrives here as `failed` with whatever the process had already written -
 * which for this CLI is usually on stdout, not stderr. */
export const runCursorAgent = async (
  args: readonly string[],
  prompt: string,
  timeoutMs: number,
): Promise<CursorRun> => {
  const execFileAsync = promisify(execFile)
  try {
    const pending = execFileAsync('cursor-agent', [...args], {
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
      timeout: timeoutMs,
      killSignal: 'SIGKILL',
    })
    pending.child.stdin?.end(prompt)
    const { stdout, stderr } = await pending
    return { stdout, stderr, failed: false }
  } catch (error) {
    const failure = error as { stdout?: unknown; stderr?: unknown }
    return {
      stdout: typeof failure.stdout === 'string' ? failure.stdout : '',
      stderr:
        typeof failure.stderr === 'string' && failure.stderr !== ''
          ? failure.stderr
          : String(error),
      failed: true,
    }
  }
}
