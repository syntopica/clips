/** `manual-only` (sensitivity: restricted) stops the clip entirely; it is
 * never synthesized and never moved. `synthesis-candidate` is what SPEC:315-321
 * calls "codex candidate" - with codex disabled (boundary decision), the
 * synthesizer on this route is the human/Claude-in-the-loop worktree step. */
export type RouteDecision = {
  route: 'synthesis-candidate' | 'needs-claude' | 'manual-only'
  reason: string
}
