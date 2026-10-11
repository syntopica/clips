/** The `vexa message` argument list that prints one message's HTML body.
 *
 * The id goes after `--` because Vexa ids can begin with `-`, and an id read as
 * an option would fail the call or, worse, change what it asks for. */
export const vexaMessageArguments = (id: string): readonly string[] => [
  'message',
  '--json',
  '--fields',
  'body_html',
  '--',
  id,
]
