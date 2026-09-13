/** One newsletter message as the transport hands it over: the day it arrived
 * and its body as markdown.
 *
 * There is no message id because there is nothing left to fetch - the body
 * arrives with the row, unlike the list-then-read shape this replaced. */
export type DigestBody = {
  date: string
  body: string
}
