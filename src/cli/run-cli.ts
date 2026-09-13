import { DataDirectoryNotFoundError } from '../config/data-directory-not-found-error.ts'
import { InvalidSyntopicaConfigError } from '../config/invalid-syntopica-config-error.ts'
import { EXIT_CODE } from './exit-code.ts'
import { runSelectedCli } from './run-selected-cli.ts'

/** Keep configuration and command failures inside the CLI exit-code boundary. */
export const runCli = async (argv: string[]): Promise<number> => {
  try {
    return await runSelectedCli(argv)
  } catch (error) {
    process.stderr.write(
      `${error instanceof DataDirectoryNotFoundError || error instanceof InvalidSyntopicaConfigError ? error.message : 'Invalid clips command or options; run clips --help'}\n`,
    )
    return EXIT_CODE.fatalLocal
  }
}
