import type { SynthesisInput } from './synthesis-input.ts'
import type { SynthesisResult } from './synthesis-result.ts'

/**
 * The pipeline depends on this, never on codex. Whether an implementation
 * exists is decided by the boundary probe, not by the pipeline.
 */
export type Synthesizer = {
  synthesize(input: SynthesisInput): Promise<SynthesisResult>
}
