/* OpenAI rate-limits this endpoint hard and gives nothing to steer by: the
 * 429 body is `{"detail":"Too many requests"}` with no `Retry-After`, and
 * four workers earned 23 of them in five conversations on 2026-08-22.
 *
 * The pace is therefore global and adaptive rather than per-request. A
 * per-request ladder backs off, succeeds, resets to full speed and earns
 * the next 429 immediately - all the waiting, none of the learning.
 *
 * But pacing alone cannot win, and measuring it is what showed why: the
 * limit is a budget per window, not a rate. A 15-minute cooldown bought
 * about 23 conversations, after which the adaptive pace climbed to 54s and
 * stayed there - the wall again, just approached politely. So the shape is
 * burst then wait: run at a civil pace until several 429s land in a row,
 * flush what was fetched, sleep a real cooldown, and start over. The queue
 * is newest-first, so an interrupted export is the useful half. */

/** Fetch conversation in the page runtime. */
export async function fetchConversation(context, path) {
  window.__cgLast = path
  // Twelve, not eight: a cooldown consumes an attempt like any other, and
  // with BURST_END at 4 a single conversation may sit through three of them
  // before the ladder runs out. That is roughly forty-five minutes of
  // patience for one conversation and it is bounded, which is the point -
  // an unbounded wait on a permanently dead endpoint is not patience.
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const response = await fetch('/backend-api' + path, {
      headers: context.headers,
    })
    if (response.ok) {
      context.state.consecutive429 = 0
      context.state.pace = Math.max(
        context.config.PACE,
        context.state.pace * 0.9,
      )
      window.__cgPaceNow = Math.round(context.state.pace)
      return response.json()
    }
    if (![429, 500, 502, 503, 504].includes(response.status))
      throw new Error(path + ' -> ' + response.status)
    if (response.status === 429) {
      window.__cg429 += 1
      context.state.consecutive429 += 1
      context.state.pace = Math.min(15000, context.state.pace * 1.5)
      window.__cgPaceNow = Math.round(context.state.pace)
      if (context.state.consecutive429 >= context.config.BURST_END) {
        context.state.consecutive429 = 0
        context.state.pace = context.config.PACE
        window.__cgPaceNow = context.config.PACE
        await context.state.cooldown()
        continue
      }
    }

    const wait = context.helpers.retryDelay(
      response,
      context.state.pace,
      attempt,
    )
    window.__cgWaiting = wait
    context.state.publish(`retry ${attempt + 1}/12 on ${response.status}`)
    await new Promise((resolve) => setTimeout(resolve, wait))
    window.__cgWaiting = 0
  }
  throw new Error(path + ' -> retries exhausted')
}
