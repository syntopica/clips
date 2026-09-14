import { commitStagedChanges } from './commit-staged-changes.ts'
import { instanceCommitMessage } from './instance-commit-message.ts'

try {
  const [repository, countText] = process.argv.slice(2)
  const count = Number(countText)
  if (!repository || !Number.isSafeInteger(count) || count < 1)
    throw new Error(
      'usage: commit-chatgpt-export-cli.ts <repository> <positive count>',
    )
  await commitStagedChanges(
    repository,
    instanceCommitMessage({ kind: 'export-chatgpt', count }),
  )
} catch (error) {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  )
  process.exitCode = 1
}
