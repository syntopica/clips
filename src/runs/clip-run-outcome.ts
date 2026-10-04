/** How one synthesis run of a clip ended, before validation and review:
 * `synthesized` left pages for the validator, `escalated` routed the clip to
 * needs-claude, `skipped` left it pending. */
export type ClipRunOutcome = 'synthesized' | 'escalated' | 'skipped'
