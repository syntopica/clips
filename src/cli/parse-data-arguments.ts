import type { DataArguments } from './data-arguments.ts'

/** Strip only the global data option, leaving subcommand parsing unchanged. */
export const parseDataArguments = (argv: string[]): DataArguments => {
  if (argv[0] !== '--data') return { explicit: undefined, arguments: argv }
  const explicit = argv[1]
  if (
    explicit === undefined ||
    explicit.length === 0 ||
    explicit.startsWith('--')
  ) {
    throw new Error('--data requires a path to syntopica.config.json')
  }
  return { explicit, arguments: argv.slice(2) }
}
