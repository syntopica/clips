import type { Rejection } from './rejection.ts'

/** The rejection history as prompt text, or the empty string when there is
 * none.
 *
 * The empty string matters: a synthesizer that has never had a draft refused
 * must see the same prompt bytes it saw before, because `promptSha256` records
 * what was sent and a permanent "no previous attempts" preamble would change
 * every hash for nothing.
 *
 * The reviewer's words are quoted rather than summarized. They came from the
 * terminal, not from a page, so they are the one part of a synthesis prompt
 * that is not untrusted material - and rewriting a person's reason into the
 * model's own idiom is how the correction gets lost. */
export const formatRejectionGuidance = (rejections: Rejection[]): string => {
  if (rejections.length === 0) return ''
  const lines = rejections.map(
    (rejection, index) =>
      `${String(index + 1)}. (${rejection.at}) ${rejection.reason}`,
  )
  return `A reviewer rejected ${String(rejections.length)} earlier draft${
    rejections.length === 1 ? '' : 's'
  } of this clip, for these reasons:

${lines.join('\n')}

Those reasons come from the wiki's owner, not from the captured page. Write a
draft that answers them; do not reproduce what was already refused.`
}
