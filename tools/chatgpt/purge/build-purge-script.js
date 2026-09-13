import { coolPurge } from '../purge/cool-purge.browser.js'
import { publishPurge } from '../purge/publish-purge.browser.js'
import { purgeWorker } from '../purge/purge-worker.browser.js'
import { readPurgeOptions } from '../purge/read-purge-options.browser.js'
import { removeConversation } from '../purge/remove-conversation.browser.js'
import { runPurge } from '../purge/run-purge.browser.js'
import { readSession } from '../shared/read-session.browser.js'
import { retryDelay } from '../shared/retry-delay.js'
import { serializePageCall } from '../shared/serialize-page-call.js'
import { purgeConversations } from './purge-conversations.browser.js'

/** Build the existing browser HTTP client for chrome-cli injection. */
export function buildPurgeScript() {
  return serializePageCall(purgeConversations, {
    retryDelay,
    readSession,
    readPurgeOptions,
    publishPurge,
    coolPurge,
    removeConversation,
    purgeWorker,
    runPurge,
  })
}
