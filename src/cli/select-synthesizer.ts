import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { BOUNDARY_DECISION_PATH } from '../sandbox/boundary-decision-path.ts'
import { readBoundaryDecision } from '../sandbox/read-boundary-decision.ts'
import { interactiveSynthesizer } from '../synthesis/interactive-synthesizer.ts'
import type { Synthesizer } from '../synthesis/synthesizer.ts'
import { selectSynthesisTransport } from './select-synthesis-transport.ts'
import { SYNTHESIS_BINARIES } from './synthesis-binaries.ts'

/** Which synthesizer writes the pages, and why - printed either way, so a run's
 * transcript always says what produced the diff.
 *
 * `--manual` always wins: the interactive human/Claude-in-the-loop synthesizer
 * needs no model, no credits and no boundary decision, which is what makes it
 * the floor this pipeline never falls through.
 *
 * Otherwise the transport comes from `CLIPS_SYNTHESIS_RUNNER`, defaulting to
 * agy since 2026-08-02. Each transport keeps its own preconditions and each
 * failure degrades to interactive rather than stopping the run: codex still
 * answers to the recorded boundary decision, and either binary being absent
 * means there is nothing to call. */
export const selectSynthesizer = async (
  manual: boolean,
): Promise<Synthesizer> => {
  if (manual) {
    process.stdout.write('synthesizer: interactive (--manual)\n')
    return interactiveSynthesizer
  }
  const name = process.env['CLIPS_SYNTHESIS_RUNNER']
  const transport = selectSynthesisTransport(name)
  const binary = SYNTHESIS_BINARIES[name ?? 'fallback'] ?? 'agy'
  if (binary === 'codex') {
    const decision = readBoundaryDecision(BOUNDARY_DECISION_PATH)
    if (decision.decision === 'CODEX_DISABLED') {
      process.stdout.write('synthesizer: interactive (codex disabled)\n')
      return interactiveSynthesizer
    }
  }
  const execFileAsync = promisify(execFile)
  try {
    await execFileAsync(binary, ['--version'], { encoding: 'utf8' })
  } catch {
    process.stdout.write(`synthesizer: interactive (${binary} not available)\n`)
    return interactiveSynthesizer
  }
  process.stdout.write(`synthesizer: ${binary}\n`)
  return transport
}
