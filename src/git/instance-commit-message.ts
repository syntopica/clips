import type { InstanceCommit } from './instance-commit.ts'

/** Keep every instance commit conventional, including unattended adapters.
 * Failure codes belong in the body so routing headers stay short. */
export const instanceCommitMessage = (commit: InstanceCommit): string => {
  switch (commit.kind) {
    case 'route':
      return `chore(clips): route clip ${commit.clipId} to needs-claude\n\nFailure: ${commit.code}`
    case 'publish':
      return `docs(brain): ingest clip ${commit.clipId}`
    case 'requeue':
      return `chore(clips): requeue clip ${commit.clipId} for synthesis`
    case 'process':
      return `chore(clips): mark clip ${commit.clipId} processed`
    case 'process-cited':
      return `chore(clips): mark ${String(commit.clipIds.length)} cited clips processed\n\nClips:\n${commit.clipIds.join('\n')}`
    case 'reconcile-cited':
      return `chore(brain): reconcile ${String(commit.clipIds.length)} cited clip ledgers\n\nClips:\n${commit.clipIds.join('\n')}`
    case 'reject':
      return `chore(clips): record review rejection ${String(commit.count)} for clip ${commit.clipId}`
    case 'harvest':
      return 'chore(clips): add pending clips from harvest'
    case 'export-chatgpt':
      return `docs(chatgpt): export ${String(commit.count)} conversations\n\nRendered from the account's own conversation trees by tools/chatgpt.\nUnattended batch; see tools/chatgpt/keeper.sh.`
  }
}
