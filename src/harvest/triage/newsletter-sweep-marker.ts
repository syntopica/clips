/** The file a triage directory carries when the newsletter collector actually
 * swept mail into it.
 *
 * The window between runs is derived from what is on disk, and a dated
 * directory alone does not mean newsletters were read: `--source medium-list`
 * writes one and exits successful, and a full run whose Vexa read failed still
 * writes one off the reading-list articles. Advancing the window on either
 * loses every newsletter in between, permanently and silently, because nothing
 * in this lane moves mail out of the way and the window only travels forward.
 * Requiring this marker is what makes "the last run that read newsletters" a
 * question the disk can answer. */
export const NEWSLETTER_SWEEP_MARKER = 'newsletter-sweep.json'
