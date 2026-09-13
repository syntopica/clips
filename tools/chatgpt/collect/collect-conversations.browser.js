/* Fetch every conversation from inside the logged-in page and hand the results
 * to Chrome as a series of downloads.
 *
 * Running in-page is not a convenience: chatgpt.com sits behind Cloudflare bot
 * protection, and the same request with the same bearer token answers 403 from
 * curl or urllib. The browser is the only client the origin accepts, which is
 * why every ChatGPT-to-markdown extension works this way.
 *
 * Payloads leave through blob downloads rather than through chrome-cli's return
 * value, which is an AppleEvent string and truncates on anything large. They go
 * in chunks because the account this was written for holds 2038 conversations:
 * one blob at the end of a half-hour run is a half-hour of work riding on a
 * single allocation, and a partial export is worth more than a lost one.
 *
 * Progress is published on `window.__cgState` so a poller outside can watch it.
 */

/** Collect conversations with dependencies serialized into the page. */
export async function collectConversations(helpers) {
  window.__cgState = 'starting'
  const config = helpers.readCollectionOptions()
  try {
    const { account, token } = await helpers.readSession()
    if (!token) {
      window.__cgState = 'ERROR: not logged in'
      return
    }
    const headers = {
      Authorization: 'Bearer ' + token,
      'Chatgpt-Account-Id': account,
      Accept: 'application/json',
    }
    const context = {
      config,
      headers,
      helpers,
      state: {
        pace: config.PACE,
        consecutive429: 0,
        publish: helpers.ignoreProgress,
        cooldown: helpers.ignoreCooldown,
      },
    }
    window.__cg429 = 0
    window.__cgWaiting = 0
    /* Every run numbers its parts from zero, so without a per-run prefix a
     * resume collides with the parts already in ~/Downloads and Chrome renames
     * the new one to `chatgpt-part-000 (1).json` - a name the converter's glob
     * does not match. Silent data loss, found on 2026-08-22 before it cost
     * anything. */
    context.state.RUN = Date.now().toString(36)

    window.__cgVault = window.__cgVault || []
    const summaries = await helpers.loadSummaries(context)
    await helpers.runCollection(context, summaries)
  } catch (outer) {
    window.__cgState = 'ERROR: ' + String(outer)
  }
}
