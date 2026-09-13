/** One piece of evidence with its text already read, for a transport that has
 * to be handed content rather than paths. `name` is what the grader will quote
 * back when it says which source did or did not support a claim, so it is the
 * readable path rather than the absolute one. */
export type InlineSource = { name: string; text: string }
