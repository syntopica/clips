/* Delete conversations from inside the logged-in page, one id at a time.
 *
 * The counterpart to `collect.js` and deliberately its mirror image: same
 * origin constraint (chatgpt.com answers 403 to any client that is not the
 * browser, so this cannot be a script on the Mac), same adaptive pace, same
 * burst-then-cooldown shape against a rate limit that is a budget per window
 * rather than a rate.
 *
 * What is different is that this one is irreversible, so it takes no decisions
 * of its own. It never lists: the queue is injected by `purge.sh`, which builds
 * it from the ids that already have both a rendered `.md` and a `raw/*.json` on
 * disk. Anything the account holds that the export does not is therefore not
 * reachable from here, which is the whole safety property - a bug in the lister
 * cannot widen the blast radius of a deleter that has no lister.
 *
 * Deletion is `PATCH /backend-api/conversation/{id}` with `is_visible: false`,
 * which is what the UI's own "Delete" does. It removes the conversation from
 * every listing, active and archived alike, and there is no undo in the
 * product.
 *
 * Progress is published on `window.__cgPurgeState` so a poller outside can
 * watch it, and failures accumulate on `window.__cgPurgeFail` instead of
 * stopping the run: one conversation the server refuses is worth reporting at
 * the end, not worth abandoning the other two thousand for.
 */

/** Purge conversations with dependencies serialized into the page. */
export async function purgeConversations(helpers) {
  const config = helpers.readPurgeOptions()
  const queue = Array.isArray(window.__cgPurgeQueue)
    ? window.__cgPurgeQueue
    : []
  if (queue.length === 0) {
    window.__cgPurgeState = 'ERROR: empty queue'
    return
  }

  window.__cgPurgeState = 'starting'
  try {
    const { account, token } = await helpers.readSession()
    if (!token) {
      window.__cgPurgeState = 'ERROR: not logged in'
      return
    }
    const headers = {
      Authorization: 'Bearer ' + token,
      'Chatgpt-Account-Id': account,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }
    const context = {
      config,
      headers,
      helpers,
      state: {
        pace: config.PACE,
        consecutive429: 0,
        deleted: 0,
        gone: 0,
        queue,
      },
    }
    window.__cg429 = 0
    window.__cgPurgeFail = []
    await helpers.runPurge(context)
  } catch (error) {
    window.__cgPurgeState = 'ERROR: ' + (error && error.message)
  }
}
