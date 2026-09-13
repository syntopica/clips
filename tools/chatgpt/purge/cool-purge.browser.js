/** Cool purge in the page runtime. */
export async function coolPurge(context) {
  const until = Date.now() + context.config.COOLDOWN
  while (Date.now() < until) {
    context.state.publish(
      `COOLDOWN ${Math.round((until - Date.now()) / 1000)}s`,
    )
    await new Promise((resolve) => setTimeout(resolve, 15000))
  }
}
