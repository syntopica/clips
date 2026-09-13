/* Workers default to four, which is the opposite of the collector's one and
 * for a measured reason. Fetching a conversation was budget-bound: the
 * limit was requests per window, so concurrency only bought 429s sooner.
 * Deleting one is latency-bound - the PATCH answers in about four seconds
 * and earns no 429 at all at one per second - so here the pool is the whole
 * difference between forty minutes and three hours. If deletion turns out
 * to have a budget of its own, the ladder and the cooldown are already
 * shared through `pace` and `consecutive429`, and the pool degrades into
 * the collector's shape rather than into a wall. */

/** Purge worker in the page runtime. */
export async function purgeWorker(context) {
  for (;;) {
    const index = context.state.cursor
    context.state.cursor += 1
    if (index >= context.state.queue.length) return
    const outcome = await context.helpers.removeConversation(
      context,
      context.state.queue[index],
    )
    if (outcome === 'deleted') context.state.deleted += 1
    else if (outcome === 'gone') context.state.gone += 1
    else window.__cgPurgeFail.push({ id: context.state.queue[index], outcome })
    context.state.publish()
    await new Promise((resolve) => setTimeout(resolve, context.state.pace))
  }
}
