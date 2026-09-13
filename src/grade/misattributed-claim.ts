/** A claim whose marker resolves to a source that does not support it, while
 * the page carries one that does.
 *
 * The error `unresolvedClaimRefs` cannot see. That check reads the marker
 * against the length of the `sources:` list, so `S30` on a 28-entry page is
 * reported and `S25` where `S27` was meant is not - the marker resolves, it
 * just resolves to the wrong entry. Nothing offline can catch it, because
 * deciding which entry supports a sentence means reading both. The grader
 * already does exactly that to decide support, so it is the one pass that can
 * report it, and reporting it as unsupported prose was the alternative: on
 * 2026-08-24, 20 of the 26 findings on `topics/claude-skills-ecosystem.md` were
 * this error wearing that label, which sent the reader looking for missing
 * evidence that was on disk the whole time.
 *
 * `marker` is the marker as the page writes it, `shouldBe` the entry the grader
 * believes was meant, or null when it can tell the marker is wrong without
 * being able to say what is right. Both are needed: a renumbering is a
 * mechanical fix when the target is named and a re-read when it is not. */
export type MisattributedClaim = {
  claim: string
  marker: string
  shouldBe: string | null
  why: string
}
