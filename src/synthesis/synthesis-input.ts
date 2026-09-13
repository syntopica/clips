export type SynthesisInput = {
  clipDirectory: string
  worktree: string
  /** Why earlier drafts of this clip were rejected, already formatted for a
   * prompt, or the empty string when none were. Empty is the common case and
   * must add nothing to the prompt: `promptSha256` records the bytes sent. */
  guidance: string
}
