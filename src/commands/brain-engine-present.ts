import { brainEngineRoot } from './brain-engine-root.ts'

/** Whether a brain engine checkout is reachable from this one.
 *
 * The ingest integration suites copy the real index generator out of it, so in
 * a clips-only clone - which is what CI checks out for the TypeScript lane -
 * they have nothing to build a brain fixture from and skip. Until 2026-09-17
 * they threw at import instead, and nine suites failed for the absence of a
 * repository the lane never had. */
export const BRAIN_ENGINE_PRESENT = brainEngineRoot() !== null
