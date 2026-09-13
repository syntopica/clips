/** The second half of the codex grading prompt: how to read [S<n>] and [OWN]
 * markers, how to report a marker that resolves to the wrong source, and the
 * JSON response format. Split out of gradePrompt purely to keep that function
 * under the line limit. Has no template placeholders, unlike the first half,
 * so it is a plain constant rather than a function. */
export const GRADE_MARKER_AND_OUTPUT_INSTRUCTION = `Some claims carry a marker naming where they came from: [S1] means the page's
first "sources:" entry, [S2] the second, and so on, and the marker may appear
rewritten as [[S1]](#sources). A claim marked [OWN] is the wiki owner's own
first-hand knowledge, which no cited source could ever support. Report those as
uncheckable, quoting the page's words, and never as unsupported - "unsupported
by these sources" and "not from a source at all" are different findings, and
reporting the second as the first is what made one page report forever, each fix
producing the next.

You resolve every marker to a source to decide support, which puts you in the
only position to catch a second error: a marker that resolves but resolves to
the WRONG entry. [S25] where [S27] was meant is not a missing source - the claim
is supported, by a source the page does not name for it - and it is commoner
than an out-of-range marker, because prepending an entry to "sources:" silently
renumbers every marker below it. Report each one in misattributed, with the
page's words, the marker as written, the entry you believe was meant (as "S7",
or null if you cannot tell which), and one sentence saying what the marked
source is about instead. Never report these as unsupported: the evidence is on
disk, and sending the reader to look for missing sources is how 20 of one page's
26 findings became a wild goose chase.

Finish by responding with only the JSON object: unsupported (one entry per
claim, each with claim - the page's words - and why, one sentence naming what
the sources say instead), uncheckable (the page's words for each claim marked
[OWN], as plain strings), misattributed (as described above), summary (one sentence), and verdict ("unsupported" if
you found anything unsupported or misattributed, "clean" if you did not -
uncheckable claims do not make a page unsupported, and a page whose only
findings are uncheckable is clean).

Every problem you found belongs in unsupported or misattributed. The summary describes what is
already listed there and must not name a problem that is missing from the list -
the count is read by tooling, so a finding that lives only in the summary is
reported as a page with nothing wrong.`
