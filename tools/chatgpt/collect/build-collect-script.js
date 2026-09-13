import { collectWorker } from '../collect/collect-worker.browser.js'
import { coolCollection } from '../collect/cool-collection.browser.js'
import { fetchConversation } from '../collect/fetch-conversation.browser.js'
import { flushCollection } from '../collect/flush-collection.browser.js'
import { listConversations } from '../collect/list-conversations.browser.js'
import { loadSummaries } from '../collect/load-summaries.browser.js'
import { publishCollection } from '../collect/publish-collection.browser.js'
import { readCollectionOptions } from '../collect/read-collection-options.browser.js'
import { runCollection } from '../collect/run-collection.browser.js'
import { emitPayload } from '../shared/emit-payload.browser.js'
import { ignoreCooldown } from '../shared/ignore-cooldown.js'
import { ignoreProgress } from '../shared/ignore-progress.js'
import { readSession } from '../shared/read-session.browser.js'
import { retryDelay } from '../shared/retry-delay.js'
import { serializePageCall } from '../shared/serialize-page-call.js'
import { collectConversations } from './collect-conversations.browser.js'

/** Build the existing browser HTTP client for chrome-cli injection. */
export function buildCollectionScript() {
  return serializePageCall(collectConversations, {
    retryDelay,
    readSession,
    ignoreProgress,
    ignoreCooldown,
    readCollectionOptions,
    fetchConversation,
    listConversations,
    emitPayload,
    publishCollection,
    flushCollection,
    coolCollection,
    collectWorker,
    loadSummaries,
    runCollection,
  })
}
