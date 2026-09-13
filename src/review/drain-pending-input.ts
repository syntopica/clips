/** Discard whatever is already waiting on the input stream.
 *
 * An answer written before the question was asked is not an answer to it. The
 * gate's stdin is usually a FIFO several steps of a batch write into, so a line
 * meant for the synthesizer's prompt, or for the previous clip, is still sitting
 * in the pipe when the review prompt opens and readline reads it as this clip's
 * verdict. That is how a diff nobody had read was applied on 2026-09-11.
 *
 * Two passes with a turn of the event loop between them, because a paused
 * stream buffers nothing until something asks: the first `read` returns null and
 * schedules the fill, the second gets what it fetched.
 *
 * Discarding costs a re-prompt at worst - the operator types the answer again -
 * while keeping the line costs an unreviewed apply. */
export const drainPendingInput = async (
  input: NodeJS.ReadableStream = process.stdin,
): Promise<void> => {
  for (let pass = 0; pass < 2; pass += 1) {
    await new Promise((resolve) => setImmediate(resolve))
    for (;;) {
      const chunk: unknown = input.read()
      if (chunk === null || chunk === undefined) break
    }
  }
}
