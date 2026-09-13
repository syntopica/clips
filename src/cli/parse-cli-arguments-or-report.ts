import type { CliArguments } from './cli-arguments.ts'
import { EXIT_CODE } from './exit-code.ts'
import { parseArguments } from './parse-arguments.ts'

/** Parse argv into CliArguments, or report a parse failure to stderr and
 * return the exit code runCli should use. Isolates the try/catch so runCli
 * itself stays a flat dispatch. */
export const parseCliArgumentsOrReport = (
  argv: string[],
): CliArguments | number => {
  try {
    return parseArguments(argv)
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    )
    return EXIT_CODE.fatalLocal
  }
}
