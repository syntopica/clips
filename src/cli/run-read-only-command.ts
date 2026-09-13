import { grade } from '../commands/grade.ts'
import { pull } from '../commands/pull.ts'
import type { Repositories } from '../commands/repositories.ts'
import { status } from '../commands/status.ts'
import type { CliArguments } from './cli-arguments.ts'
import { EXIT_CODE } from './exit-code.ts'
import { USAGE_TEXT } from './usage-text.ts'

/** The commands that take no ingest lock and write nothing to either
 * repository: help, pull, status, and grade. Returns null when `args` names
 * none of them, so runCli can fall through to the next dispatch group. */
export const runReadOnlyCommand = async (
  args: CliArguments,
  repositories: Repositories,
): Promise<number | null> => {
  if (args.command === 'help') {
    process.stdout.write(USAGE_TEXT)
    return EXIT_CODE.success
  }
  if (args.command === 'pull') return pull(repositories.clips)
  if (args.command === 'status')
    return status(repositories.brain, repositories.clips)
  // Grade reads both repositories and writes nothing, so it needs no lock and
  // is safe to run against a wiki an ingest is still writing to.
  // A null author: the command is handed page paths and no synthesis run, so
  // there is nothing to ask who wrote them and the guard falls back to reading
  // CLIPS_SYNTHESIS_RUNNER.
  if (args.command === 'grade')
    return grade(repositories.brain, repositories.clips, args.pages, null)
  return null
}
