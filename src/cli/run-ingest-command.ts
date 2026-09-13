import { ingest } from '../commands/ingest.ts'
import type { Repositories } from '../commands/repositories.ts'
import { releaseLock } from '../lock/release-lock.ts'
import type { CliArguments } from './cli-arguments.ts'
import { EXIT_CODE } from './exit-code.ts'
import { selectPageGrader } from './select-page-grader.ts'
import { selectReviewer } from './select-reviewer.ts'
import { selectSynthesizer } from './select-synthesizer.ts'

/** The only command that takes the ingest lock, so it is the only one that has
 * to give it back.
 *
 * SPEC:435-436: the lock is released even on SIGINT and SIGTERM. releaseLock
 * only removes a lock this pid owns, so an unrelated run's lock is never
 * touched by the handler. */
export const runIngestCommand = async (
  args: CliArguments,
  repositories: Repositories,
): Promise<number> => {
  const onSignal = (): void => {
    void (async (): Promise<never> => {
      await releaseLock(repositories.brain)
      process.exit(EXIT_CODE.interrupted)
    })()
  }
  process.on('SIGINT', onSignal)
  process.on('SIGTERM', onSignal)
  try {
    return await ingest(
      { brain: repositories.brain, clips: repositories.clips },
      { clipFilter: args.clip, dryRun: args.dryRun },
      {
        synthesizer: await selectSynthesizer(args.manual),
        reviewer: selectReviewer(args.autoReview),
        grader: selectPageGrader(args.grade),
      },
    )
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    )
    return EXIT_CODE.fatalLocal
  } finally {
    process.off('SIGINT', onSignal)
    process.off('SIGTERM', onSignal)
  }
}
