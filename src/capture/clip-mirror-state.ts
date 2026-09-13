/** How far a clip got, as the capture service stores it.
 *
 * The same three values as the service's own `CaptureState`, declared here
 * rather than imported because the two packages share no code and a copied
 * union that drifts is caught by the service's 400 on an unrecognised state.
 * SPEC: ~/p/brain/docs/superpowers/specs/2026-08-04-clip-state-in-the-browser-design.md */
export type ClipMirrorState = 'captured' | 'ingested' | 'needs-claude'
