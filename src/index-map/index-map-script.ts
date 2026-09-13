/** The generator that owns `index.md`, repo-relative. It lives in the wiki
 * rather than in this CLI because the root map is the wiki's shape, not the
 * ingest's - and because a git worktree of the brain carries it, so the trusted
 * step runs the same script the operator runs by hand. */
export const INDEX_MAP_SCRIPT = 'tools/index/build.py'
