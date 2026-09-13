/** Drain only the injected purge queue with the configured worker pool. */
export async function runPurge(context) {
  context.state.publish = (note) => context.helpers.publishPurge(context, note)
  context.state.cooldown = () => context.helpers.coolPurge(context)
  context.state.cursor = 0
  await Promise.all(
    Array.from({ length: Math.max(1, context.config.WORKERS) }, () =>
      context.helpers.purgeWorker(context),
    ),
  )
  window.__cgPurgeState =
    `DONE ${context.state.deleted} deleted, ${context.state.gone} already gone, ` +
    `${window.__cgPurgeFail.length} failed`
}
