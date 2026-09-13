/** The reason for a clip whose synthesis prompt exceeds Cursor's ceiling.
 *
 * A near-copy of `overCeilingPromptFailure` and not a reuse of it, because the
 * one sentence that matters differs: that one says `argv ceiling`, which is
 * true of agy and false here. Getting it wrong would send the next reader to
 * measure `ARG_MAX`, which is not what refuses on this transport.
 *
 * The remedy names codex for the same reason the agy version does. A clip is
 * captured rather than authored here, so "make it smaller" is advice nobody can
 * act on; codex is handed the path instead of the text and has room. */
export const cursorOverCeilingFailure = (
  bytes: number,
  ceilingBytes: number,
): string =>
  `the synthesis prompt is ${String(Math.round(bytes / 1024))} KB, over cursor's ${String(Math.round(ceilingBytes / 1024))} KB prompt ceiling, past which this transport answers with an empty result and no error; synthesize it with CLIPS_SYNTHESIS_RUNNER=codex, which is handed the clip's path rather than its text`
