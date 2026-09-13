import { execFile } from 'node:child_process'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { codexGradeArgs } from './codex-grade-args.ts'
import { EVIDENCE_BYTE_BUDGET } from './evidence-byte-budget.ts'
import { evidenceBytes } from './evidence-bytes.ts'
import { gradeFailureTail } from './grade-failure-tail.ts'
import { GRADE_OUTPUT_SCHEMA } from './grade-output-schema.ts'
import type { GradeRunner } from './grade-runner.ts'
import { gradeTimeoutMs } from './grade-timeout-ms.ts'

/** The real codex invocation for grading, and it is deliberately weaker than
 * the synthesizer's: `-s read-only` (the grader has nothing to write) and no
 * `--search`, because a grader with web access answers "is this true somewhere"
 * instead of "do the cited sources say this". `--skip-git-repo-check` because
 * the clip store and the brain are separate roots and the grader is pointed at
 * whichever holds the page. The timeout scales with the evidence, SIGKILL, and stdin closed up front -
 * codex exec blocks reading stdin otherwise. */
export const runCodexGrade: GradeRunner = {
  evidenceCeilingBytes: EVIDENCE_BYTE_BUDGET,
  run: async (root, pagePath, evidencePaths) => {
    const scratch = await mkdtemp(join(tmpdir(), 'codex-grade-'))
    const schemaPath = join(scratch, 'output-schema.json')
    const lastMessagePath = join(scratch, 'last-message.txt')
    await writeFile(schemaPath, JSON.stringify(GRADE_OUTPUT_SCHEMA))
    const execFileAsync = promisify(execFile)
    const timeout = gradeTimeoutMs(await evidenceBytes(evidencePaths))
    try {
      const pending = execFileAsync(
        'codex',
        codexGradeArgs(root, pagePath, evidencePaths, {
          schemaPath,
          lastMessagePath,
        }),
        {
          encoding: 'utf8',
          maxBuffer: 8 * 1024 * 1024,
          timeout,
          killSignal: 'SIGKILL',
        },
      )
      pending.child.stdin?.end()
      await pending
      return {
        exitCode: 0,
        lastMessage: await readFile(lastMessagePath, 'utf8').catch(() => null),
        stderrTail: '',
      }
    } catch (error) {
      const failure = error as {
        code?: number
        stderr?: string
        killed?: boolean
        signal?: string
      }
      return {
        exitCode: failure.code ?? 1,
        lastMessage: await readFile(lastMessagePath, 'utf8').catch(() => null),
        stderrTail: gradeFailureTail(failure, timeout),
      }
    }
  },
}
