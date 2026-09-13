/** Publish purge in the page runtime. */
export function publishPurge(context, note) {
  window.__cgPurgeState =
    `purging ${context.state.deleted + context.state.gone + window.__cgPurgeFail.length}/${context.state.queue.length} ` +
    `deleted=${context.state.deleted} gone=${context.state.gone} failed=${window.__cgPurgeFail.length} ` +
    `429=${window.__cg429} pace=${Math.round(context.state.pace)}ms` +
    (note ? ' ' + note : '')
}
