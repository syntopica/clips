/** One page the writing pass returned: its path relative to the worktree and
 * its complete new content. */
export type WorkerPageWrite = {
  path: string
  content: string
}
