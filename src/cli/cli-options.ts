import type { CliArguments } from './cli-arguments.ts'

/** Everything on the command line except the command itself: the flags, with
 * their defaults already applied. `help` and a real command produce the same
 * shape, which is why the defaults live in one place. */
export type CliOptions = Omit<CliArguments, 'command'>
