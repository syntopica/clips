/** One changed path in the synthesis worktree, as read from
 * `git status --porcelain=v2 -z`. `kind` keeps only what validation needs to
 * judge; anything the parser cannot classify becomes `unsupported` and is
 * rejected with its raw record as evidence. */
export type WorktreeChange = {
  path: string
  kind: 'added' | 'modified' | 'untracked' | 'unsupported'
  detail: string
}
