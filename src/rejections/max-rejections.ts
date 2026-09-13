/** How many rejections a clip gets before it stops being offered to a model.
 *
 * Five, from `kytmanov`. The number is not the point; having one is. Without a
 * ceiling a clip the reviewer keeps turning down is synthesized again on every
 * run, which spends model quota to reproduce a draft a human has already read
 * and refused. At the ceiling the clip goes to needs-claude, which is this
 * repository's existing "a person has to handle this" state rather than a new
 * one. */
export const MAX_REJECTIONS = 5
