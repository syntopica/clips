/* Workers default to one, and the reason is measured rather than cautious:
 * four of them were no faster than one, because the limit is on requests
 * per window and not on concurrency - they only converted the same budget
 * into 429s sooner. The pool survives as a knob for an account that turns
 * out not to be throttled, and it is the only thing here that is not safe
 * above one: two workers can enter `flush` together and interleave the
 * chunk counter onto one filename. Chunks are small (25) so a run that dies
 * loses little, since the whole point of this shape is that dying is
 * expected. */
// Redundant when `run.sh` launches it, since `queue.py` has already
// subtracted what is on disk. Kept for a hand-injected queue.

/** Drain the collection queue with the configured worker pool. */
export async function runCollection(context, summaries) {
  const skip = new Set(window.__cgSkip || [])
  const todo = summaries.filter((s) => !skip.has(s.id))
  window.__cgSkipped = summaries.length - todo.length
  Object.assign(context.state, {
    todo,
    cursor: 0,
    done: 0,
    chunk: [],
    part: 0,
    bursts: 0,
    cooldownMs: context.config.COOLDOWN,
    atLastCooldown: 0,
  })
  context.state.publish = (note) =>
    context.helpers.publishCollection(context, note)
  context.state.cooldown = () => context.helpers.coolCollection(context)
  await Promise.all(
    Array.from({ length: context.config.WORKERS }, () =>
      context.helpers.collectWorker(context),
    ),
  )
  await context.helpers.flushCollection(context, true)
  window.__cgState = `DONE ${context.state.done} fetched, ${window.__cgSkipped} skipped, ${context.state.part} parts`
}
