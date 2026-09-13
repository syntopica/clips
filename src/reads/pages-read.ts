/** Which existing pages the synthesizer opened while it ran, or the fact that
 * nobody can say.
 *
 * `'unobservable'` is a third state next to a list and an empty list, and the
 * distinction is the whole point: an empty list asserts the transport read
 * nothing, and on a filesystem that does not record reads that is a false
 * statement rather than a missing one. Same shape `verification:` settled on
 * for a page whose staleness cannot be read - report it, never infer absence. */
export type PagesRead = string[] | 'unobservable'
