# Capturing any website, not only Medium - design

Status: **milestones 1 and 2 built and verified, 2026-08-04 and 2026-08-05.**

Owner's direction, 2026-08-04: _"el clip va a pillar de todas las webs, no solo
medium, eso hay que solucionarlo"_. It came an hour after the phone lane worked
for the first time and immediately captured an `anthropic.com` page, which
`clips drain` could not fetch.

## Why this is a real gap and not an accepted limitation

The harvest's promotion path reads Medium's Apollo state, and that was fine
while the harvest was the only lane: 1685 of 1688 measured hosts were Medium,
because the sources are Medium newsletters and reading lists **by
construction**. The limitation was recorded in `TODO.md` as something that could
never be ticked.

The phone breaks that. It is the lane where the owner shares whatever they are
reading, so the host distribution is the open web rather than one publisher. The
first real capture proved it on the first try.

There is a second defect underneath, and it is the one that makes this urgent
rather than merely desirable. A capture whose fetch fails stays in the inbox -
correct, because a failed fetch must never consume a capture - but a
**permanent** failure then repeats forever: the row is stuck, the inbox grows,
and `clips drain` exits non-zero on every future run. That is the always-fails
shape, the mirror of the always-fires check this repository has removed twice.

## What was measured before designing anything

Seven URLs, raw `fetch` from Node, extracted with Defuddle over jsdom:

| Host                  | Status  | Words | Note                        |
| --------------------- | ------- | ----- | --------------------------- |
| anthropic.com         | 200     | 694   | the capture that started it |
| medium.com            | **403** | 0     | `Just a moment...`          |
| news.ycombinator.com  | 200     | 57    | short but complete          |
| github.com            | 200     | 312   |                             |
| developer.mozilla.org | 200     | 396   |                             |
| x.com                 | 200     | 274   |                             |
| elpais.com            | **403** | 8     | bot wall                    |

**The failure mode is not JavaScript rendering. It is bot blocking.** That
reframes the whole design, because the obvious remedy for a JS-rendered page is
a headless browser, and a headless browser is a poor remedy for a Cloudflare
interstitial.

Re-fetching the two failures through Python's TLS stack, with a browser
User-Agent and no cookies at all:

| Host       | Node `fetch` | Python `urllib` |
| ---------- | ------------ | --------------- |
| elpais.com | 403          | **200**         |
| medium.com | 403          | **200**         |

This generalises a finding the repository already had and had filed as
Medium-specific: `medium_transport.py` exists because "Python returns 200, while
Node's `fetch`, Node's `https` module and `curl` all return 403 - `cf_clearance`
is bound to the TLS fingerprint of the client that earned it". The fingerprint
is not about Medium. It is about who is asking.

End to end, Python transport into the Defuddle extractor:

| URL                      | Words | Title                                  |
| ------------------------ | ----- | -------------------------------------- |
| elpais.com/tecnologia    | 355   | Tecnología en EL PAÍS                  |
| medium.com (member-only) | 1831  | Building an agent harness              |
| anthropic.com            | 694   | A new way to reflect on how you use... |
| developer.mozilla.org    | 396   | Fetch API                              |

## The design, which the measurement made smaller

**One transport, Python, for every host.** Not "Medium through Python and
everything else through `fetch`". The Node branch would fail on exactly the
sites the Python one handles, and maintaining two fetchers to get a worse result
is the trade backwards. `medium_transport.py` generalises into a page fetcher
whose Medium-ness is one header away.

**Medium keeps its cookie jar.** The spike returned 1831 words without cookies,
but the harvest verified on 2026-07-29 that a member-only article returns only
its intro to an anonymous fetch, and cookies cost nothing. Send them when the
host is Medium, send a bare browser User-Agent otherwise.

**One extractor: Defuddle over jsdom, copied from brain-clipper.** The extension
already runs `defuddle/full` and its own test suite runs under
`environment: 'jsdom'`, which is the evidence that it works outside a browser.
Same fallback chain - `defuddle` -> `article` -> `main` -> `body` ->
`innertext` - and the same 100-character minimum that rejects a trivial wrapper.
Markdown through `turndown` plus the GFM plugin, as the extension does.

Copied rather than shared as a package: the precedent is
`clip-metadata-schema.ts`, copied from brain-clipper deliberately and recorded
as such in its own header.

**`extractor` and `site_extractor` keep meaning what they already mean.** Both
fields are in `ClipMetadataSchema` because the extension writes them; a drained
clip now fills them the same way from the same library, so a clip's provenance
reads identically whichever lane produced it.

### The dependency stance changes, deliberately

`tools/clips` has exactly one runtime dependency and says so in
`buildFrontmatter`'s own comment, where it justifies a hand-rolled YAML emitter.
This design adds three: `defuddle`, `jsdom` and `turndown` (plus
`turndown-plugin-gfm`). That is a real change and it is the owner's call - the
requirement is the open web, and re-implementing site-specific extraction for
twenty-odd hosts is not a smaller cost than a dependency. The hand-rolled
emitter stays: it is unrelated, and the comment gets a pointer here rather than
a deletion.

### A permanent failure produces a body-less clip

Owner's choice, 2026-08-04, over routing to `needs-claude` or leaving the row in
the inbox. When extraction cannot produce a body, write a clip that keeps the
**URL, the note and the capture timestamp** and mark the capture drained.

`snapshot_mode: 'omitted'` already exists in the schema for exactly this and is
already used by the thin-clip backfill's duplicate, so **no schema change is
needed**: `word_count: 0`, `content_sha256` over the empty body, and an
`index.md` that is frontmatter and nothing else. A page that ever cites such a
clip can see that its source has no captured text, which is the honest state -
as against a page resting on a source that silently has no body, which is what
the thin clips were.

The inbox empties, the drain goes green, and nothing is lost: the URL is the
irreducible value and it is kept.

## Milestones

**Milestone 1 - the general path.** Python transport for any host, Defuddle
extraction, turndown markdown, body-less clip on failure. This is what closes
the owner's request and unsticks the capture sitting in the inbox today.

**Milestone 2 - headless fallback.** Owner chose "raw first, headless only as a
reserve". Specified here and **built 2026-08-05**, once a real capture produced
an empty extraction the raw path could not explain and served as its
specification. Expected yield was small and was: one page of the two that
qualified. See the amendment below for what the measurement changed.

**The trigger must be "extraction produced nothing", not "produced little".**
`news.ycombinator.com/item?id=1` is 57 words and complete. A minimum-length
threshold would send every short-but-whole page to a browser, which is the
always-fires shape wearing a different hat.

## Security, briefly

The URL comes from the owner's phone, which is not a hostile source, but it is
still a URL from outside this machine driving an outbound request, and it now
reaches arbitrary hosts rather than one.

- `https` only, refused before the request rather than followed and rejected.
- A redirect cap, with the scheme re-checked at each hop.
- A response size cap enforced while reading, not from `Content-Length`.
- A total timeout.

What this does **not** need is the loopback reasoning from the capture service's
design: that mattered because the fetch would have run on server-a, beside two
password-less Redis instances. This runs on the Mac, in the same process family
that already fetches Medium daily.

## What this deliberately does not do

- **No JavaScript execution in milestone 1.** A page that genuinely needs it
  produces a body-less clip that names the reason, which is a report rather than
  a silent gap.
- **No second extractor to compare against.** The extension's chain is the
  chain; a page that both lanes capture should read the same either way, and a
  second implementation would make that untrue by construction.
- **No widening of the harvest's promotion path.** The harvest keeps its Medium
  extractor, because its sources are Medium and its volume is 1400 titles. This
  is the drain's fetcher, not a replacement for that one.

## Amendments

### 2026-08-04 - milestone 1, and what building it found

Built the same day. Verified against five real captures queued through the live
service and drained in one run:

| Host                         | Extractor | Words | Note                             |
| ---------------------------- | --------- | ----- | -------------------------------- |
| www.anthropic.com            | defuddle  | 694   | the capture that was stuck       |
| elpais.com                   | defuddle  | 355   | 403 to Node `fetch`, 200 here    |
| github.com                   | defuddle  | 312   |                                  |
| news.ycombinator.com         | defuddle  | 57    | `site_extractor: true`           |
| a host that does not resolve | -         | 0     | body-less clip, reason in `note` |

`clips drain` exited 0, `clips status` reports 1493 clips with 0 unreadable, and
the inbox is empty. The Hacker News capture is the one worth noticing:
Defuddle's own Hacker News extractor fired, so `site_extractor` is `true` there
and `false` on the generic pages - the field means what it means in the
extension, which was the point of reusing the library rather than writing an
extractor.

**The note was never reaching a clip, in either lane.** `buildClipMetadata` had
`note: ''` hard-coded since the harvest was written, and the harvest never
noticed because nothing types a note into a triage checkbox. The drain does: the
phone's note is the only thing the owner writes at capture time, and the failure
reason has nowhere else to go. Found by a lint rule complaining that a computed
`note` was unused, which is a better reviewer than the design was.

**`extractor` is meaningless on a body-less clip** and there is no honest enum
member for "none". `snapshot_mode: 'omitted'` and `word_count: 0` are the fields
that say so; widening the schema for a value nothing routes on would change
every reader for the benefit of none. Recorded in the code rather than fixed.

**Adding the dependencies re-linked the workspace and emptied `tools/x`'s
`node_modules`**, which surfaced as a type-check failure in an unrelated
package. `pnpm install` at the root restores it. Worth knowing before reading
such a failure as a real one.

### 2026-08-04 - YouTube: the fallback chain was writing JavaScript into clips

Raised by the owner while deciding what to do about the wiki's one uncapturable
citation, a YouTube URL cited by [[topics/llm-wiki]]: _"a ver el vídeo es bajar
el transcript para coger lo importante, no me quiero tragar un vídeo de youtube
de una hora para sacar 4 parrafos interesantes"_. Correct, and it exposed
something worse than an uncapturable page.

**What the chain did with a watch page.** Measured on
`youtube.com/watch?v=zmrPY6S1FwY`:

| Path                          | Result                                         |
| ----------------------------- | ---------------------------------------------- |
| Defuddle `parse()` (what ran) | 318 chars - the embed iframe, below the floor  |
| `DOM_FALLBACKS` -> `body`     | **636,918 chars of `ytInitialPlayerResponse`** |
| Defuddle `parseAsync()`       | 23,898 chars - the timestamped transcript      |

So a YouTube capture did not fail and did not produce a body-less clip. It
produced a clip six hundred thousand characters long, holding jsdom's reading of
the inline `<script>` tags, labelled `extractor: 'body'` as though a container
had been found. That is the always-fails shape's quieter sibling: not a command
stuck red, but a clip that looks captured and would be handed to a synthesizer.

**The capability was already paid for.** `extract-page.ts` says in its own
docstring that "the async path is what reaches the network, for things like a
YouTube transcript", and chooses `parse()` because it runs against HTML already
in hand. That reasoning is right for every host whose article is in the bytes
and wrong for the one class where the text is a second request.

**Shape.** `isTranscriptHost(url)` selects `extractTranscriptPage`, which runs
`parseAsync()` and has **no fallback chain below it** - the chain is what
produced the JSON blob, and a video with no captions genuinely has no readable
text, so `null` becomes the body-less clip this design already specifies. The
predicate is a host list, not a length threshold, for the reason
`MIN_EXTRACTED_LENGTH` already gives: `news.ycombinator.com/item?id=1` is 57
words and complete, so "short body, fetch harder" fires on short-but-whole
pages. Which hosts hide their text behind a second request is a fact about the
host.

`extractor` stays `'defuddle'` with `siteExtractor: true` rather than gaining a
`'transcript'` member. It is accurate - Defuddle's own YouTube extractor is what
ran - and `PageExtractor` is the union `ClipMetadataSchema` validates, shared
with brain-clipper, so widening it is a change to both lanes for a value nothing
routes on. The same reasoning the body-less clip's `extractor` field got above.

**Verified end to end** through `capturePage`: the video returns 19,210
characters opening `## Transcript` / `**0:00** ·`, `extractor: defuddle`,
`siteExtractor: true`; and `anthropic.com/news/reflect-with-claude`, the
control, is unchanged at 5,084 characters on the synchronous path with
`siteExtractor: false`.

**The `body` fallback reading script text was the general half, and it is closed
too** (same day). It reads `document.body.textContent`, and the DOM fallbacks
reach `innerHTML` on the same nodes, so inline `<script>` state is extraction on
any script-heavy page - YouTube was where it became visible, not the only page
it can happen to. `stripNonContentElements` removes `script`, `style`,
`noscript` and `template` **after Defuddle has parsed and before the fallback
chain runs**, which is the only correct place: Defuddle's site extractors mine
exactly those nodes for JSON-LD and `__NEXT_DATA__`, so stripping first would
take the good extraction away to protect the fallback.

Measured on the same watch page through `extractPage`, the path that produced
the blob: **636,918 characters to 747**. Nothing in the store was affected -
only three clips carry `extractor: 'body'` and all three are the body-less ones,
so this was a latent trap rather than damage. The YouTube capture that would
have landed as a blob never did, because the capture service was deduplicating
it away against an unrelated video for an unrelated reason.

### 2026-08-05 - milestone 2, and the two citations that specified it

Built on the owner's call, against the specification this design asked for: "a
real capture the raw path cannot explain, used as its specification". The wiki
held exactly two, and measuring them first is what kept the milestone small,
because **they are one of each kind and only one of them is this milestone's**:

| URL                             | Raw transport       | Headless Chrome                 |
| ------------------------------- | ------------------- | ------------------------------- |
| `docs.openclaw.ai/architecture` | 200, 387-byte shell | 99,905 chars, 716 words extract |
| `axios.com/2026/02/23/...`      | **403**             | a Cloudflare interstitial       |

So the trigger this design already specified - "extraction produced nothing",
never "produced little" - needed one more clause, and the measurement wrote it:
**never "the fetch failed" either**. A browser cures the page whose text is a
second request and has nothing to say to a host that refused this client, which
is the same finding the original measurement made from the other side when it
sent every host through Python's TLS stack. A 403 therefore returns without
paying for a render, and `axios.com` stays a body-less clip permanently.

**A transcript host does not reach the reserve.** `extractTranscriptPage`
already makes the second request and deliberately has no fallback chain under
it; a video with no captions has no text, and every step below that point
returns the player's chrome.

#### The browser binary is the part worth writing down

Chrome 150.0.7871.189 **writes the whole document and then never exits**, on
`example.com` as readily as on a heavy page. Measured against `--headless=old`,
`--single-process`, `--no-startup-window` and `--disable-breakpad`: none of them
changes it. `chrome-headless-shell` exits in about a second with byte-identical
output.

Both are supported rather than one, because the failure is recoverable and the
recovery is four lines: `--dump-dom` serializes the document in a single write
at the end, so a run killed by the timeout that reached `</html>` printed the
page, and `completeDump` says which. Treating that as a failure would throw away
the render the whole path exists to get. Pointing `CLIPS_HEADLESS_BROWSER` at a
headless shell turns the 30-second wait into a 1-second one, and that is the
only thing configuring it buys - **measured 2s against 30s end to end on the
same URL, same 5,686-character body**.

#### What a clip records about having been rendered

Nothing, deliberately, beyond `source.html` - which holds the rendered DOM,
because `source.html` is defined as what extraction ran against and
`source_html_sha256` hashes it. No new `extractor` member and no new field: the
schema is shared with brain-clipper, and this is the same trade already recorded
for the body-less clip's own `extractor`. The limit is real and stated here
rather than worked around - a reader of a clip cannot tell a rendered capture
from a raw one except by the shape of its HTML.

#### Closing the citation was a rewrite, not a re-drain

The service answers `already_captured` for a URL it has seen, and the drain
skips a URL already in the clip store, so neither lane re-fetches a page whose
capture the code has since learned to read. The body-less clip was `pending`
with no page written from it, so rewriting it edited no history: the directory
was removed and `writeCapturedClip` ran again over the same capture record,
reusing the real writer rather than patching metadata by hand. A one-off, kept
out of the repository on purpose - the population is closed by construction,
since a JS-rendered page now gets its render at capture time.

One trap for whoever repeats it: `writeCapturedClip` returns an **absolute**
path and the service's `PATCH` wants a repository-relative `clip_dir`. Passing
the absolute one returns 400, and `mirrorClipState` swallows it as a warning by
design, so the row keeps a `clip_dir` pointing at a directory that no longer
exists and nothing says so.

**Result:** `clips audit` reports 4 findings, down from 5, and unresolved
citations 2 pages down to 1. The remaining one is `axios.com`, which is
permanent and now correctly reported rather than silently satisfied.
