import type { CliArguments } from './cli-arguments.ts'

import { COMMANDS } from './commands.ts'
import { isHelpRequest } from './is-help-request.ts'
import { parseOptions } from './parse-options.ts'

/** The command, then its flags. Both halves are tables now: `COMMANDS` decides
 * the first argument, `parseOptions` the rest. */
export const parseArguments = (argv: string[]): CliArguments => {
  const [first, ...rest] = argv
  if (isHelpRequest(first)) return { command: 'help', ...parseOptions([]) }
  if (!COMMANDS.has(first)) throw new Error(`unknown command: ${first}`)
  return {
    command: first as CliArguments['command'],
    ...parseOptions(rest),
  }
}
