/* Published from inside the retry ladder as well as from the worker loop.
 * Updating it only on a completed conversation meant a request grinding
 * through eight backoffs showed the same string for ten minutes, which
 * reads exactly like a dead tab - and did, on 2026-08-22, until the live
 * counters were read directly and turned out to disagree with it. A
 * progress line nobody can distinguish from a stall is not progress. */

/** Publish collection in the page runtime. */
export function publishCollection(context, note) {
  window.__cgState =
    `fetching ${context.state.done}/${context.state.todo.length} (part ${context.state.part}) ` +
    `429=${window.__cg429} pace=${Math.round(context.state.pace)}ms` +
    (note ? ` ${note}` : '') +
    (window.__cgWaiting ? ` WAITING ${window.__cgWaiting}ms` : '')
}
