/** The argv for one Cursor grading run.
 *
 * `--mode ask` is this transport's spelling of the read-only posture the agy
 * grader gets from `--sandbox --mode plan`: Q&A, no edits. No `--force` and no
 * `--yolo`, and the omission is the point, the same one `agyGradeArgs` makes -
 * inlined captured text is the ideal carrier for a prompt-injection payload,
 * this repository holds live credentials, and a grader needs no tools at all
 * because everything it may consider is already in the prompt. Cursor
 * additionally sends that prompt to a third party, which is an argument for
 * fewer capabilities on this transport, never more.
 *
 * `--trust` is unavoidable rather than chosen. Without it `cursor-agent`
 * refuses any directory it has not seen before, in about 0.7 seconds, with
 * `Workspace Trust Required` on stdout and nothing on stderr - a fast and
 * legible refusal interactively, and an unattended run that reports every page
 * as ungraded for a reason the operator has to go read. It grants the workspace,
 * not the tools; `--mode ask` is what keeps the tools away.
 *
 * There is no `--output-schema` here and no equivalent: the five required keys
 * are stated in the prompt by `CURSOR_SCHEMA_INSTRUCTION`, which is why that
 * module exists.
 *
 * **No prompt appears in this argv**, and the omission is load-bearing rather
 * than tidy. `-p` is `--print`, the non-interactive flag, and the prompt it
 * prints an answer to arrives on stdin - see `runCursorAgent` for the
 * measurement that forced it. Passing the prompt positionally here works on a
 * small page and fails silently on a large one. */
export const cursorGradeArgs = (model: string): string[] => [
  '-p',
  '--trust',
  '--model',
  model,
  '--mode',
  'ask',
  '--output-format',
  'json',
]
