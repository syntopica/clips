import { findDataDirectory } from '../config/find-data-directory.ts'
import { loadSyntopicaConfig } from '../config/load-syntopica-config.ts'
import { withSyntopicaConfig } from '../config/with-syntopica-config.ts'
import { doctorReport } from '../doctor/doctor-report.ts'
import { parseDoctorSkipArguments } from '../doctor/parse-doctor-skip-arguments.ts'
import { EXIT_CODE } from './exit-code.ts'
import { parseCliArgumentsOrReport } from './parse-cli-arguments-or-report.ts'
import { parseDataArguments } from './parse-data-arguments.ts'
import { resolveCliRepositories } from './resolve-cli-repositories.ts'
import { runReadOnlyCommand } from './run-read-only-command.ts'
import { USAGE_TEXT } from './usage-text.ts'

/** Resolve the caller's instance and pass its repositories through dispatch. */
export const runSelectedCli = async (argv: string[]): Promise<number> => {
  const selected = parseDataArguments(argv)
  if (selected.arguments[0] === 'doctor') {
    const rest = selected.arguments.slice(1)
    if (rest.length > 0 && rest[0] !== '--json')
      throw new Error('doctor does not accept additional arguments')
    const json = rest.length > 0
    const skip = json ? parseDoctorSkipArguments(rest) : []
    return doctorReport(
      findDataDirectory(selected.explicit, process.env, process.cwd()),
      process.env,
      json,
      skip,
    )
  }
  const args = parseCliArgumentsOrReport(selected.arguments)
  if (typeof args === 'number') return args
  if (args.command === 'help') {
    process.stdout.write(USAGE_TEXT)
    return EXIT_CODE.success
  }
  const root = findDataDirectory(selected.explicit, process.env, process.cwd())
  const config = loadSyntopicaConfig(root, process.env)
  const repositories = resolveCliRepositories(config)
  return withSyntopicaConfig(config, async () => {
    const readOnlyResult = await runReadOnlyCommand(args, repositories)
    if (readOnlyResult !== null) return readOnlyResult
    // Imported on demand so a read-only command never loads the write and
    // ingest graphs; see runReadOnlyCommand.
    const { runUnlockedWriteCommand } =
      await import('./run-unlocked-write-command.ts')
    const unlockedWriteResult = await runUnlockedWriteCommand(
      args,
      repositories,
    )
    if (unlockedWriteResult !== null) return unlockedWriteResult
    const { runIngestCommand } = await import('./run-ingest-command.ts')
    return runIngestCommand(args, repositories)
  })
}
