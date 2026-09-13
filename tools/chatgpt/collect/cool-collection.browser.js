/* The cooldown adapts to what the last burst actually yielded, because the
 * window is not fixed either. Rested, a 15-minute wait bought 23
 * conversations; after a day of hammering the same wait bought one, and a
 * fixed cooldown at that yield is three weeks of politely knocking on a
 * door that is bolted. A thin burst means the budget is not back yet, so
 * wait longer - and a fat one means it is, so return to the base. Capped at
 * two hours, which over a weekend is patience rather than surrender. */

/** Cool collection in the page runtime. */
export async function coolCollection(context) {
  context.state.bursts += 1
  const yielded = context.state.done - context.state.atLastCooldown
  context.state.atLastCooldown = context.state.done
  if (context.state.bursts > 1) {
    if (yielded < 5)
      context.state.cooldownMs = Math.min(7200000, context.state.cooldownMs * 2)
    else if (yielded >= 15) context.state.cooldownMs = context.config.COOLDOWN
  }
  await context.helpers.flushCollection(context, true)
  window.__cgWaiting = context.state.cooldownMs
  context.state.publish(
    `burst ${context.state.bursts} yielded ${yielded}, cooling ${Math.round(context.state.cooldownMs / 60000)}min`,
  )
  await new Promise((resolve) => setTimeout(resolve, context.state.cooldownMs))
  window.__cgWaiting = 0
}
