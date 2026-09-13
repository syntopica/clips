/** Instance selection is separate from each existing subcommand's options. */
export type DataArguments = {
  readonly explicit: string | undefined
  readonly arguments: string[]
}
