/** The argument list of the synthesis `codex` call. `--json` puts the event
 * stream on stdout for its token usage; the verdict is still read from `-o`. */
export const codexExecArguments = ({
  prompt,
  worktree,
  schemaPath,
  lastMessagePath,
}: {
  prompt: string
  worktree: string
  schemaPath: string
  lastMessagePath: string
}): string[] => [
  // --search is a top-level flag, not an exec option; it must come before the
  // subcommand (verified: `exec --search` exits 2).
  '--search',
  'exec',
  prompt,
  '-C',
  worktree,
  '-s',
  'danger-full-access',
  '-c',
  'model_reasoning_effort=xhigh',
  '--skip-git-repo-check',
  '--json',
  '--output-schema',
  schemaPath,
  '-o',
  lastMessagePath,
]
