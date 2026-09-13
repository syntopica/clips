import { execFile } from 'node:child_process'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
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
 * pipeline. */
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
        [
          // --search is a top-level flag, not an exec option; it must come
          // before the subcommand (verified: `exec --search` exits 2).
          '--search',
          'exec',
          prompt,
          '-C',
          worktree,
          '-s',
          'danger-full-access',
          '-c',
          'model_reasoning_effort=xhigh',
          '--skip-git-repo-check',
          '--output-schema',
          schemaPath,
          '-o',
          lastMessagePath,
        ],
        {
          encoding: 'utf8',
          maxBuffer: 8 * 1024 * 1024,
          timeout: 20 * 60 * 1000,
          killSignal: 'SIGKILL',
        },
      )
      // codex exec blocks reading stdin unless it is closed up front - the
      // documented `< /dev/null` behavior, done here by ending the pipe.
      pending.child.stdin?.end()
      await pending
      const lastMessage = await readFile(lastMessagePath, 'utf8').catch(
        () => null,
      )
      return { exitCode: 0, lastMessage, stderrTail: '' }
    } catch (error) {
      const failure = error as { code?: number; stderr?: string }
      const lastMessage = await readFile(lastMessagePath, 'utf8').catch(
        () => null,
      )
      return {
        exitCode: failure.code ?? 1,
        lastMessage,
        stderrTail: (failure.stderr ?? '').slice(-2000),
      }
    }
  },
}
