/* Returns 'deleted', 'gone' or a status string. A 404 is success by another
 * name: the conversation is not there to delete, which is the state this
 * run is trying to reach, and treating it as a failure would make a resume
 * after a half-finished run report thousands of them. */

/** Remove conversation in the page runtime. */
export async function removeConversation(context, id) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const response = await fetch('/backend-api/conversation/' + id, {
      method: 'PATCH',
      headers: context.headers,
      body: JSON.stringify({ is_visible: false }),
    })
    if (response.ok) {
      context.state.consecutive429 = 0
      context.state.pace = Math.max(
        context.config.PACE,
        context.state.pace * 0.9,
      )
      return 'deleted'
    }
    if (response.status === 404) return 'gone'
    if (![429, 500, 502, 503, 504].includes(response.status))
      return String(response.status)
    if (response.status === 429) {
      window.__cg429 += 1
      context.state.consecutive429 += 1
      context.state.pace = Math.min(15000, context.state.pace * 1.5)
      if (context.state.consecutive429 >= context.config.BURST_END) {
        context.state.consecutive429 = 0
        context.state.pace = context.config.PACE
        await context.state.cooldown()
        continue
      }
    }
    const wait = context.helpers.retryDelay(
      response,
      context.state.pace,
      attempt,
    )
    context.state.publish(`retry ${attempt + 1}/12 on ${response.status}`)
    await new Promise((resolve) => setTimeout(resolve, wait))
  }
  return 'retries exhausted'
}
