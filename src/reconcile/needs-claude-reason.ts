/** Why a clip is being routed to needs-claude, in the error taxonomy's terms
 * (SPEC:471-487): `stage` locates it in the pipeline, `code` is the taxonomy
 * entry, `message` the human evidence. */
export type NeedsClaudeReason = {
  stage: string
  code: string
  message: string
}
