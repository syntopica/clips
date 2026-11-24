import { createHash } from 'node:crypto'

/** The hex digest that keys a synthesis job: the model, the step and the
 * prompt, plus the excluded providers when there are any. A job with none keeps
 * the key it always had, so a rerun still collects what an earlier run left
 * queued; one with an exclusion cannot collide with the same prompt without
 * it, which the worker would refuse as a different body under one key. */
export const workerSynthesisDigest = (
  model: string,
  step: string,
  prompt: string,
  excluded: readonly string[],
): string =>
  createHash('sha256')
    .update(
      excluded.length === 0
        ? `${model}\n${step}\n${prompt}`
        : `${model}\n${step}\n${prompt}\nexclude:${excluded.join(',')}`,
    )
    .digest('hex')
