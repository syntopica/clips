/** Hashed in this order. state.json is absent on purpose: it is the only
 * mutable file in a clip. SPEC:518-522. */
export const IMMUTABLE_CLIP_FILES = [
  'metadata.json',
  'index.md',
  'source.html',
] as const
