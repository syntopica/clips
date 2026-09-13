/* Listing is 21 requests against the same rate-limited endpoint the fetch
 * loop needs, and a resume that re-lists spends its budget before reaching
 * a single conversation. So `run.sh` injects the queue it already holds -
 * the saved index minus what is on disk - and only a cold start lists. */

/** Reuse the injected queue or list both conversation sets. */
export async function loadSummaries(context) {
  let summaries = window.__cgQueue
  if (!Array.isArray(summaries) || summaries.length === 0) {
    summaries = [
      ...(await context.helpers.listConversations(context, false)),
      ...(await context.helpers.listConversations(context, true)),
    ]
    context.helpers.emitPayload(context, 'chatgpt-index.json', { summaries })
  }
  return summaries
}
