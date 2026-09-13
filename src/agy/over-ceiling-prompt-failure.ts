/** The reason for a clip whose prompt exceeds this transport's argv ceiling.
 *
 * Its whole job is to carry the two numbers and the remedy. Without the check
 * this failure arrives as `spawn E2BIG` through `agyFailureTail`, which names
 * neither how big the clip was nor what to do about it - and the clip routes to
 * needs-claude looking like a model problem when it is a host limit.
 *
 * The remedy names codex rather than telling the operator to split the clip. A
 * clip is captured, not authored here, so "make it smaller" is advice nobody
 * can take; codex is handed the path instead of the text and has room. Same
 * lesson `overBudgetFailure` learned on 2026-08-03 when it stopped telling the
 * operator to split a hub. */
export const overCeilingPromptFailure = (
  bytes: number,
  ceilingBytes: number,
): string =>
  `the synthesis prompt is ${String(Math.round(bytes / 1024))} KB, over agy's ${String(Math.round(ceilingBytes / 1024))} KB argv ceiling; synthesize it with CLIPS_SYNTHESIS_RUNNER=codex, which is handed the clip's path rather than its text`
