// Floor of 4, not lower: a shorter floor lets a FAILED short ref (a mistyped
// or deleted revision) reach countMatchingObjects, where in any repository of
// real size a coincidental prefix collision across blobs/trees/commits/tags
// misreports it as ambiguous instead of missing. Four is also git's own
// minimum abbreviation length.
export const HEX_ABBREVIATION = /^[0-9a-f]{4,40}$/i
