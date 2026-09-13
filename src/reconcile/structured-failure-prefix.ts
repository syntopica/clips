/** What separates a structured failure from the free text `state.json.failure`
 * held before it (SPEC:456-469). Written by `structuredFailure`, required by
 * `parseStructuredFailure`. */
export const STRUCTURED_FAILURE_PREFIX = 'phase4:error:'
