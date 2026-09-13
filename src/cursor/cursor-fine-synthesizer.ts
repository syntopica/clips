import { CURSOR_SYNTHESIS_MODEL } from '../models/cursor-synthesis-model.ts'
import type { Synthesizer } from '../synthesis/synthesizer.ts'
import { cursorSynthesizer } from './cursor-synthesizer.ts'
import { cursorSynthesisRunner } from './run-cursor-synthesis.ts'

/** Synthesis on the Cursor account, bound to its model.
 *
 * One binding rather than a fine and a bulk pair, because the subscription is
 * one quota and the tier split exists to say which quota a pass may spend. */
export const cursorFineSynthesizer: Synthesizer = cursorSynthesizer(
  cursorSynthesisRunner(CURSOR_SYNTHESIS_MODEL),
)
