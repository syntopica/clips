import type { SenderYield } from './newsletter/sender-yield.ts'

/** Name the senders whose mail arrived and produced no article at all, or
 * return an empty string when every sender that wrote contributed.
 *
 * Measured 2026-08-08 over the window since the previous run: 11 of the 32
 * emails scanned came from senders that yielded nothing, because
 * `hasMediumPostId` is the article test and only Medium URLs carry that id.
 * Daily Dose of DS, Thinking Machines and OpenAI are read and then silently
 * drop out, which a total of 32 reads as coverage. Naming them keeps the
 * summary honest until the extractor learns a second article shape. */
export const formatSilentSenders = (
  senders: readonly SenderYield[],
): string => {
  const silent = senders.filter(
    (one) => one.emailCount > 0 && one.linkCount === 0,
  )
  if (silent.length === 0) return ''
  const named = silent
    .map((one) => `${one.sender} (${String(one.emailCount)})`)
    .join(', ')
  return `  no articles from  ${named}\n`
}
