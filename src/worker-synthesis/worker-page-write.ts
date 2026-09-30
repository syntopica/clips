/** One page the writing pass returned: its path relative to the worktree, its
 * complete new content, and - for a page that does not exist yet - the shown
 * page that should link to it. */
export type WorkerPageWrite = {
  path: string
  content: string
  link_from?: string | undefined
}
