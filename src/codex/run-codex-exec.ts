import { execFile } from 'node:child_process'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { parseCodexUsage } from '../runs/parse-codex-usage.ts'
import { codexExecArguments } from './codex-exec-arguments.ts'
import { CODEX_OUTPUT_SCHEMA } from './codex-output-schema.ts'
import type { CodexRunner } from './codex-runner.ts'

/** The real codex invocation, at the full capability the operator asked for
 * on 2026-07-28 ("activalo a full power"): `-s danger-full-access` (no
 * sandbox at all - reads, writes and command network are all open) plus
 * `--search` for live web lookups, and reasoning forced to xhigh. The brain
 * is still protected downstream - only validated worktree paths are ever
 * staged, and a human approves every diff - but nothing constrains what the
 * codex process itself can touch or transmit; that is the recorded override.
 * `exec` is non-interactive by design, so no approval flag exists or is
 * needed; stdin is closed up front (codex blocks reading it otherwise).
 * Timeout is 20 minutes - doubled from the spec's table for search-enabled
 * xhigh runs - delivered as SIGKILL so a hung run cannot outlive the
 * pipeline.
 *
 * `--json` puts the event stream on stdout, which is read for nothing but the
 * token usage of each completed turn; the verdict still comes from `-o`. */
export const runCodexExec: CodexRunner = {
  run: async (worktree, prompt) => {
    const scratch = await mkdtemp(join(tmpdir(), 'codex-ingest-'))
    const schemaPath = join(scratch, 'output-schema.json')
    const lastMessagePath = join(scratch, 'last-message.txt')
    await writeFile(schemaPath, JSON.stringify(CODEX_OUTPUT_SCHEMA))
    const execFileAsync = promisify(execFile)
    try {
      const pending = execFileAsync(
        'codex',
        codexExecArguments({ prompt, worktree, schemaPath, lastMessagePath }),
        {
          encoding: 'utf8',
          maxBuffer: 64 * 1024 * 1024,
          timeout: 20 * 60 * 1000,
          killSignal: 'SIGKILL',
        },
      )
      // codex exec blocks reading stdin unless it is closed up front - the
      // documented `< /dev/null` behavior, done here by ending the pipe.
      pending.child.stdin?.end()
      const { stdout } = await pending
      const lastMessage = await readFile(lastMessagePath, 'utf8').catch(
        () => null,
      )
      return {
        exitCode: 0,
        lastMessage,
        stderrTail: '',
        usage: parseCodexUsage(stdout),
      }
    } catch (error) {
      const failure = error as {
        code?: number
        stderr?: string
        stdout?: string
      }
      const lastMessage = await readFile(lastMessagePath, 'utf8').catch(
        () => null,
      )
      return {
        exitCode: failure.code ?? 1,
        lastMessage,
        stderrTail: (failure.stderr ?? '').slice(-2000),
        usage: parseCodexUsage(failure.stdout ?? ''),
      }
    }
  },
}
