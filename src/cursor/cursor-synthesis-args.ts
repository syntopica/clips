/** The argv for one Cursor synthesis run, and it is the permissive one.
 *
 * `--force` grants every tool without prompting, which the grade lane refuses
 * and this lane cannot avoid: a synthesizer must create and edit files, so the
 * safe configuration and the task are mutually exclusive. That is the same
 * trade `runAgySynthesis` records, and it rests on the same operator decision -
 * extended to Cursor on 2026-09-11, after being asked, with the risk stated:
 * a prompt-injection payload inside a clip can make this model read what this
 * user can read and transmit it, now through a third party's channel as well.
 *
 * `--workspace` is what confines the writing to the ingest worktree, and it is
 * the one capability cursor has that agy does not - agy has no
 * working-directory flag at all, which is why `agySynthesisPrompt` must name
 * every path in full. The prompt here still names them absolutely, because the
 * worktree path is unambiguous either way and one prompt shape serving both
 * transports is worth more than the few bytes.
 *
 * What still stands between this and the brain is unchanged and is not nothing:
 * the hard validator accepts only paths inside the five page directories plus
 * `index.md`, refuses a page marked `reviewed: true`, refuses a change that
 * drops a `## Contested` entry, and a human approves every diff before it is
 * committed.
 *
 * No prompt in argv - it arrives on stdin, for the reason `runCursorAgent`
 * records. */
export const cursorSynthesisArgs = (
  worktree: string,
  model: string,
): string[] => [
  '-p',
  '--trust',
  '--force',
  '--workspace',
  worktree,
  '--model',
  model,
  '--output-format',
  'json',
]
