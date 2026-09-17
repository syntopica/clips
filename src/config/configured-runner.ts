import { currentSyntopicaConfig } from './current-syntopica-config.ts'

/** Which transport this instance configured for `stage`, or null where it
 * configured none.
 *
 * One source for every execution selector, and the reason the `runners` block
 * is worth writing: until 2026-09-17 the selectors read `CLIPS_*_RUNNER`
 * straight off the environment, so configuring `runners.synthesis` changed
 * what doctor reported and nothing about what ran. The loader merges those
 * variables into the document before validating it, so the environment still
 * wins - it now wins through the configuration instead of around it, and a
 * value the schema does not register can no longer reach a selector. */
export function configuredRunner(stage: string): string | null {
  return currentSyntopicaConfig().runners[stage] ?? null
}
