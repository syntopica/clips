import type { MockInstance } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { runTriageWithFallback } from './run-triage-with-fallback.ts'

// Hoisted so the mock factories can close over them: `vi.mock` is lifted above
// every `const` in the file, and taking the spies off the mocked objects
// afterwards would read them as unbound methods.
const { codex, agyRun } = vi.hoisted(() => ({
  codex: vi.fn(),
  agyRun: vi.fn(),
}))

vi.mock('./run-codex-triage-batch.ts', () => ({
  runCodexTriageBatch: codex,
}))
vi.mock('./agy-bulk-triage.ts', () => ({
  agyBulkTriage: { run: agyRun },
}))

describe('runTriageWithFallback', () => {
  let stderrWrite: MockInstance<typeof process.stderr.write>

  beforeEach(() => {
    vi.clearAllMocks()
    stderrWrite = vi.spyOn(process.stderr, 'write').mockReturnValue(true)
  })

  it('returns codex verdicts and never reaches agy on a clean run', async () => {
    codex.mockResolvedValue({ message: '{"verdicts":[]}', outOfCredits: false })

    await expect(runTriageWithFallback.run('0\ta\tb')).resolves.toBe(
      '{"verdicts":[]}',
    )
    expect(agyRun).not.toHaveBeenCalled()
  })

  it('switches to agy when codex is out of credits', async () => {
    codex.mockResolvedValue({ message: null, outOfCredits: true })
    agyRun.mockResolvedValue('{"verdicts":[{"id":0}]}')

    await expect(runTriageWithFallback.run('0\ta\tb')).resolves.toBe(
      '{"verdicts":[{"id":0}]}',
    )
    expect(agyRun).toHaveBeenCalledWith('0\ta\tb')
  })

  it('announces the switch on stderr rather than swapping silently', async () => {
    codex.mockResolvedValue({ message: null, outOfCredits: true })
    agyRun.mockResolvedValue(null)

    await runTriageWithFallback.run('0\ta\tb')

    expect(stderrWrite).toHaveBeenCalledWith(
      expect.stringContaining('codex is out of credits'),
    )
  })

  it('degrades to null on any other codex failure instead of switching', async () => {
    // A timeout or a kill is retryable, so re-running it on a different model
    // would change who classified the batch for no durable reason.
    codex.mockResolvedValue({ message: null, outOfCredits: false })

    await expect(runTriageWithFallback.run('0\ta\tb')).resolves.toBeNull()
    expect(agyRun).not.toHaveBeenCalled()
    expect(stderrWrite).not.toHaveBeenCalled()
  })

  it('passes agy failure through as null, losing nothing to review', async () => {
    codex.mockResolvedValue({ message: null, outOfCredits: true })
    agyRun.mockResolvedValue(null)

    await expect(runTriageWithFallback.run('0\ta\tb')).resolves.toBeNull()
  })
})
