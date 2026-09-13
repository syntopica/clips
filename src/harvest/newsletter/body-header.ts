/** One body-content message as the sweep sees it: subject and date, never the
 * body. The sweep only needs enough to make a triage candidate, and not
 * reading bodies is what keeps a wide window inside the memory discipline
 * `readVexaDigests` documents. */
export type BodyHeader = {
  date: string
  subject: string
}
