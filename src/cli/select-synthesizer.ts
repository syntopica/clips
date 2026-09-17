import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { configuredRunner } from '../config/configured-runner.ts'
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
 * Otherwise the transport is `runners.synthesis`, which `CLIPS_SYNTHESIS_RUNNER`
 * overrides through the configuration loader. An instance that configured none
 * gets the interactive synthesizer and is told so: an unconfigured wiki used to
 * reach for agy on its own, which meant a first run either called a model the
 * owner had never chosen or reported `agy not available` for a binary they had
 * no reason to install.
 *
 * Each transport keeps its own preconditions and each failure degrades to
 * interactive rather than stopping the run: codex still answers to the recorded
 * boundary decision, and either binary being absent means there is nothing to
 * call. */
export const selectSynthesizer = async (
  manual: boolean,
): Promise<Synthesizer> => {
  if (manual) {
    process.stdout.write('synthesizer: interactive (--manual)\n')
    return interactiveSynthesizer
  }
  const name = configuredRunner('synthesis')
  if (name === null || name === 'manual') {
    const reason =
      name === null ? 'runners.synthesis unset' : 'runners.synthesis'
    process.stdout.write(`synthesizer: interactive (${reason})\n`)
    return interactiveSynthesizer
  }
  const transport = selectSynthesisTransport(name)
  const binary = SYNTHESIS_BINARIES[name] ?? 'agy'
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
