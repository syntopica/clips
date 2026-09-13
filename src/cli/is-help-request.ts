/** No command at all is a request for help, not an error: a bare `clips` should
 * print the usage text rather than report that `undefined` is unknown. */
export const isHelpRequest = (
  first: string | undefined,
): first is undefined | 'help' | '--help' =>
  first === undefined || first === 'help' || first === '--help'
