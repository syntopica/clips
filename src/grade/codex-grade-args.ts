import { gradePrompt } from './grade-prompt.ts'

/** The argv for one codex grading run, deliberately weaker than the
 * synthesizer's: `-s read-only` because the grader has nothing to write, and no
 * `--search`, because a grader with web access answers "is this true somewhere"
 * instead of "do the cited sources say this". `--skip-git-repo-check` because
 * the clip store and the brain are separate roots and the grader is pointed at
 * whichever holds the page. */
export const codexGradeArgs = (
  root: string,
  pagePath: string,
  evidencePaths: readonly string[],
  scratch: { schemaPath: string; lastMessagePath: string },
): string[] => [
  'exec',
  gradePrompt(pagePath, evidencePaths),
  '-C',
  root,
  '-s',
  'read-only',
  '--skip-git-repo-check',
  '--output-schema',
  scratch.schemaPath,
  '-o',
  scratch.lastMessagePath,
]
