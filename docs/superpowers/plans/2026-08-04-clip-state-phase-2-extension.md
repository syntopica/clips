# Clip state, phase 2: the extension shows it

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** The toolbar icon says, per tab, whether the page is already in the
clip store and how far it got; clicking a page that is already known opens a
panel instead of clipping it twice, and that panel is where a deliberate
re-capture is asked for.

**Architecture:** The extension asks `GET /api/have` for the active tab's URL,
memoises the answer per URL in `chrome.storage.session`, and paints one of four
pre-rendered icon sets with `chrome.action.setIcon({ tabId })`.
`chrome.action.setPopup({ tabId })` is set only when a clip already exists,
which keeps the one-click capture on every new page. After a successful commit
the extension tells the service, so the desktop lane stops being invisible to
it.

**Tech Stack:** Manifest V3, TypeScript, esbuild, vitest, `rsvg-convert` for the
icon rasterisation.

Spec: `docs/superpowers/specs/2026-08-04-clip-state-in-the-browser-design.md`.
Phase 1 (the service and the Mac's pushes) shipped 2026-08-04.

## Global Constraints

- English in every artifact; no assistant attribution anywhere.
- Atomic File Rule: one file, one exported unit. This repository already follows
  it strictly - keep to it.
- ASCII punctuation in edited text.
- `pnpm typecheck && pnpm test && pnpm build` must be green before each commit.
- The capture token is a device credential: `chrome.storage.local`, never
  `sync`, alongside the GitHub credential. Never logged, never in a commit.
- A denylisted hostname must not be named to the capture service any more than
  it may be clipped.

## Two decisions taken from the spec, and why

**No URL normalisation in the extension.** The spec asked for a third copy of
`normalize()`; the service already normalises inside `findCaptureByUrl`, so the
extension sends the tab's URL verbatim and there is nothing to keep in sync. The
repository's existing `normalizeUrl` is a different function for a different job
(it builds a clip's `normalized_url`) and stays untouched.

**The service origin is a constant, not a setting.** There is exactly one, the
same reasoning `tools/clips` applies. Only the token needs a field in the
options page.

**The `tabs` permission is new and is a real widening.** Reading the URL of a
tab the user has not clicked the extension on requires it. Without it, per-tab
state is not possible at all. Note it in the README next to what the extension
already asks for.

---

### Task 1: The icon set

**Files:**

- Create: `icons/brain-clip.svg`, `scripts/build-icons.mjs`,
  `icons/<state>-<size>.png` (16/32/48/128 for `idle`, `captured`, `ingested`,
  `error`)
- Modify: `build.mjs` (copy `icons/` into `dist/`), `src/manifest.json`
  (`icons`, `action.default_icon`), `package.json` (an `icons` script)

- [ ] **Step 1: Draw the master SVG** - a flat brain with a paperclip through
      it, one weight, no gradients, `currentColor` for the body so one file
      renders every tint.
- [ ] **Step 2: Write `scripts/build-icons.mjs`** - substitutes the tint into
      the SVG and shells out to `rsvg-convert` for each size, writing
      `icons/<state>-<size>.png`. Tints: idle `#6b7280`, captured `#b45309`,
      ingested `#2e7d32`, error `#c62828`.
- [ ] **Step 3: Run it and look at the 16px output.** A shape that is unreadable
      at 16 is the only thing that matters here; iterate on the SVG until it is
      not.
- [ ] **Step 4: Wire the manifest and the build**, then `pnpm build` and confirm
      `dist/icons` carries all sixteen files.
- [ ] **Step 5: Commit.**

---

### Task 2: Asking the service

**Files:**

- Create: `src/shared/capture-service-origin.ts`,
  `src/shared/capture-token-key.ts`, `src/shared/get-capture-token.ts`,
  `src/shared/set-capture-token.ts`, `src/shared/clip-state.ts`,
  `src/shared/have-response-schema.ts`, `src/shared/clip-status.ts`,
  `src/shared/fetch-clip-status.ts`
- Test: `tests/shared/fetch-clip-status.test.ts`

**Interfaces:**

- Produces:
  `type ClipState = 'absent' | 'captured' | 'ingested' | 'needs-claude'`;
  `type ClipStatus = { state: ClipState; clipUrl: string | null; capturedAt: string | null }`;
  `fetchClipStatus(url: string): Promise<ClipStatus>`.

- [ ] **Step 1: Write the failing test** - a `200` with `captured: true` and
      `state: 'ingested'` returns that state and the clip URL; a `200` with
      `captured: false` returns `absent`; a `401`, a network throw, and a
      missing token each return `absent` without throwing.
- [ ] **Step 2: Run it and watch it fail.**
- [ ] **Step 3: Implement.** Every failure resolves to `absent`, which is the
      only safe direction: an over-eager "already captured" suppresses a capture
      that never happened.
- [ ] **Step 4: Run the test.**
- [ ] **Step 5: Commit.**

---

### Task 3: Per-tab icon and popup

**Files:**

- Create: `src/background/clip-status-cache.ts`,
  `src/background/resolve-clip-status.ts`, `src/background/icon-paths.ts`,
  `src/background/apply-tab-status.ts`, `src/background/refresh-tab-status.ts`
- Modify: `src/background/service-worker.ts` (the `tabs` listeners),
  `src/manifest.json` (`tabs` permission, `host_permissions` for the service)
- Test: `tests/background/icon-paths.test.ts`,
  `tests/background/clip-status-cache.test.ts`

- [ ] **Step 1: Write the failing tests** - `iconPaths` maps each state to its
      set and `absent` to idle; the cache returns a stored answer without a
      second fetch and does not store failures.
- [ ] **Step 2: Run and watch them fail.**
- [ ] **Step 3: Implement.** `refreshTabStatus` ignores anything that is not
      `http`/`https` and anything denylisted, and sets the popup only when a
      clip exists.
- [ ] **Step 4: Run the tests and `pnpm build`.**
- [ ] **Step 5: Commit.**

---

### Task 4: The panel

**Files:**

- Create: `src/popup/popup.html`, `src/popup/popup.ts`,
  `src/popup/render-status.ts`, `src/popup/status-sentence.ts`,
  `src/popup/recapture.ts`
- Modify: `build.mjs`
- Test: `tests/popup/status-sentence.test.ts`

- [ ] **Step 1: Write the failing test** for the sentence each state produces.
- [ ] **Step 2: Run and watch it fail.**
- [ ] **Step 3: Implement.** The panel shows the state, the capture date, a link
      to the clip on GitHub, and a _Capture again_ button that fires the same
      capture the toolbar click fires and closes.
- [ ] **Step 4: `pnpm build`, load the unpacked extension, and look at it.**
- [ ] **Step 5: Commit.**

---

### Task 5: Telling the service about a desktop clip

**Files:**

- Create: `src/shared/record-capture.ts`, `src/shared/push-clip-state.ts`,
  `src/background/report-clip-to-service.ts`
- Modify: `src/background/handle-captured-page.ts` (return the clip's
  directory), `src/background/service-worker.ts` (report, then repaint the tab
  amber)
- Test: `tests/background/report-clip-to-service.test.ts`

- [ ] **Step 1: Write the failing test** - a successful clip posts the URL and
      then patches `captured` with the clip directory; every failure is
      swallowed, because a clip that is committed must not be reported as
      failed.
- [ ] **Step 2: Run and watch it fail.**
- [ ] **Step 3: Implement**, invalidating the cached status for that URL so the
      icon turns amber immediately.
- [ ] **Step 4: Run the tests.**
- [ ] **Step 5: Commit.**

---

### Task 6: The token in the options page, and the README

**Files:**

- Modify: `src/options/options.html`, `src/options/load.ts`,
  `src/options/save-settings.ts`, `README.md`
- Test: none - it is a field bound to the two functions above

- [ ] **Step 1: Add the field**, saved to `chrome.storage.local` under its own
      key. An empty token is valid and means the icon stays grey; that is not an
      error.
- [ ] **Step 2: Document in the README** what the icon colours mean, the new
      `tabs` permission and why it is needed, and that a missing token costs the
      colours and nothing else.
- [ ] **Step 3: `pnpm typecheck && pnpm test && pnpm build`.**
- [ ] **Step 4: Commit.**

---

### Task 7: Prove it in a real browser

- [ ] **Step 1: Load the unpacked extension**, set the `chrome-extension`
      capture token in the options page.
- [ ] **Step 2: Open a page known to be `ingested`** (any URL under
      `clips/processed/`) - the icon must be green and clicking must open the
      panel with a working GitHub link.
- [ ] **Step 3: Open a page known to be `captured`** - amber, panel, link to the
      pending directory.
- [ ] **Step 4: Open a page that was never clipped** - grey, and one click still
      clips it directly.
- [ ] **Step 5: Watch that clip turn the icon amber** without a reload, and
      confirm `GET /api/have` now answers `captured` for it.
- [ ] **Step 6: Re-capture from the panel** and confirm a second clip directory
      appears, with the first untouched.
- [ ] **Step 7: Record the result** in the extension's `TODO.md` / the brain,
      closing the "tell the user a page is already clipped" item and the "what
      does a repeat clip do" decision.
