/** The argv for one agy grading run.
 *
 * No `--dangerously-skip-permissions`, and the omission is the point - see the
 * note on `agyGradeRunner`. `--sandbox` and `--mode plan` narrow the surface
 * further, and cost nothing because a grader needs no tools at all.
 *
 * `--disable-slash-commands` was here too until 2026-08-24 and had to go,
 * because agy applies `--mode plan` through the same expansion it disables:
 * `warning: --mode plan has no effect while slash command expansion is
 * disabled`, printed on every run since this file was written. Measured rather
 * than read off the warning. With both flags, a print-mode run told to create a
 * file answered `DONE`, and the file was really there - in
 * `~/.gemini/antigravity-cli/scratch/`, not the working directory, which is
 * what `--sandbox` buys and all it buys. With `--disable-slash-commands`
 * dropped, the same prompt died at its first tool call:
 * `permission check failed for command "pwd": user denied permission`. So the
 * two flags do not add up - one silently switches the other off - and plan mode
 * is the one that refuses.
 *
 * `--print-timeout` is passed in minutes rather than fixed at 20, so it tracks
 * the process timeout the caller computed from the evidence size. The two
 * disagreeing means either agy gives up on a run the caller was still willing
 * to wait for, or the caller kills a run agy would have finished. */
export const agyGradeArgs = (
  prompt: string,
  model: string,
  schemaPath: string,
  printTimeoutMinutes: number,
): string[] => [
  '-p',
  prompt,
  '--model',
  model,
  '--json-schema',
  schemaPath,
  '--output-format',
  'json',
  '--print-timeout',
  `${String(printTimeoutMinutes)}m`,
  '--sandbox',
  '--mode',
  'plan',
]
