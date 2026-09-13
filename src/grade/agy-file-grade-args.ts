/** The argv for one agy grading run that reads its evidence from disk.
 *
 * The inline variant (`agyGradeArgs`) is the default and keeps its safe flags;
 * this one exists only for an evidence set too large for the argv ceiling,
 * where the choice used to be "refuse" and is now "hand over paths". That
 * needs the model to actually open files, so it carries
 * `--dangerously-skip-permissions` - an operator decision (2026-08-18, "quizás
 * se pueda solucionar con permisos mencionando el archivo y que lo abra él"),
 * the same accepted risk already recorded for synthesis in `runAgySynthesis`:
 * an injection payload inside a clip can make the model read anything this
 * user can read and transmit it through the model channel. What still stands
 * is that the verdict changes no file and a human reads the findings.
 *
 * No `--mode plan`, deliberately: plan mode blocks the read tools that are the
 * whole point of this variant - measured 2026-08-18, a `ListDirectory` request
 * under plan mode sat at `approved=false` until the run timed out and came
 * back as an empty body. `--sandbox` and `--disable-slash-commands` stay.
 *
 * Also measured before this existed, against the recorded belief that agy
 * "skims or never finds" files: given absolute paths and permissions it read
 * three files totalling 1 MB, fell back to grep when its read tool truncated,
 * and returned sentinels planted at the ends; and it answered a semantic
 * verification question about a passage buried mid-way through a 400 KB file
 * with the decisive wording quoted, in 28 seconds. The old belief was about
 * relative paths with no permission to read at all. */
export const agyFileGradeArgs = (
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
  '--disable-slash-commands',
  '--dangerously-skip-permissions',
]
