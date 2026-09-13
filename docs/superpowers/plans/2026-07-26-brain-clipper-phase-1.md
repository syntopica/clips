# brain-clipper Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Manifest V3 Chrome extension that turns the current page (or the
current selection) into clean markdown and lands it as one atomic commit in a
private GitHub repo.

**Architecture:** A content script injected on demand extracts and converts the
page; the service worker assembles four immutable clip files and writes them
through the GitHub Git Data API (blobs -> tree -> commit -> ref) in a single
commit. No queue, no assets, no ingest - those are later phases.

**Tech Stack:** TypeScript, pnpm, esbuild, Vitest + jsdom,
`@mozilla/readability`, `turndown` + `turndown-plugin-gfm`, `dompurify`,
`js-yaml`, `ulid`, `zod`.

Spec: `docs/superpowers/specs/2026-07-26-brain-clipper-design.md` (revision 3).

## Global Constraints

- Repository: `~/p/brain-clipper`, remote `BusiRocket/brain-clipper` (private).
  Data repo: `BusiRocket/brain-clips` (private).
- One file = one exported unit = one responsibility (`~/.claude/CLAUDE.md`
  atomic file rule). No `utils.ts`, no grouped helpers.
- All code, comments, identifiers, commit messages and docs in English. ASCII
  punctuation.
- No `Co-Authored-By`, no "Generated with" footer, no reference to
  Claude/Anthropic/AI in any commit message.
- TypeScript strict mode on. No `any` in committed code.
- Node >= 20 (uses `globalThis.crypto.subtle`), pnpm as package manager.
- GitHub API version header `2022-11-28`, `authorization: Bearer <token>` and
  `accept: application/vnd.github+json` on every request. One deliberate
  exception: a Contents API read overrides `accept` with
  `application/vnd.github.raw+json`, because the default returns a base64
  envelope instead of the file body.
- Byte caps: `MAX_GIT_BLOB_BYTES = 950_000`, `MAX_SOURCE_HTML_BYTES = 950_000`,
  `MAX_MARKDOWN_BYTES = 950_000`, `MAX_CLIP_BYTES = 15_000_000`.
- Clip directory:
  `clips/pending/YYYY/MM/<YYYY-MM-DD>-<site-slug>-<title-slug>-<clip_id[:8]>`,
  leaf name capped at 96 chars.
- `content_sha256` = SHA-256 of the normalized UTF-8 markdown body, excluding
  frontmatter and excluding all mutable workflow state.

### Explicitly out of scope for Phase 1

Implementing any of these is a plan violation, even partially, even "just the
interface":

IndexedDB - durable queue - automatic retries - `chrome.alarms` - job leases -
image or asset downloading - broad host permissions (`https://*/*`) - note and
tags UI - context menu - multi-machine concurrency handling - Mac-side ingest
CLI - codex - ledger - domain adapters - Chrome Web Store packaging.

No speculative abstractions for future phases. Interfaces that Phase 1 needs are
fine; a generic queue, an asset pipeline, or an adapter framework "for later"
are not.

---

### Task 1: Bootstrap the extension repo

**Files:**

- Create: `~/p/brain-clipper/package.json`
- Create: `~/p/brain-clipper/tsconfig.json`
- Create: `~/p/brain-clipper/vitest.config.ts`
- Create: `~/p/brain-clipper/tests/setup.ts`
- Create: `~/p/brain-clipper/build.mjs`
- Create: `~/p/brain-clipper/.gitignore`
- Create: `~/p/brain-clipper/src/manifest.json`
- Create: `~/p/brain-clipper/src/background/service-worker.ts`
- Create: `~/p/brain-clipper/README.md`

**Interfaces:**

- Consumes: nothing.
- Produces: `pnpm build` emitting `dist/` (loadable unpacked), `pnpm test`
  running Vitest, a stable extension id via `manifest.key`.

- [ ] **Step 1: Create the repo and install dependencies**

```bash
mkdir -p ~/p/brain-clipper && cd ~/p/brain-clipper && git init
pnpm init
pnpm add @mozilla/readability turndown turndown-plugin-gfm dompurify js-yaml ulid zod
pnpm add -D typescript esbuild vitest jsdom @types/chrome @types/node @types/turndown @types/js-yaml
```

- [ ] **Step 2: Generate the signing key and derive `manifest.key`**

The extension id must be identical on every machine and across unpacked loads
from different paths.

```bash
openssl genrsa 2048 | openssl pkcs8 -topk8 -nocrypt -out ~/p/brain-clipper/key.pem
openssl rsa -in ~/p/brain-clipper/key.pem -pubout -outform DER | base64 | tr -d '\n'
```

Copy the base64 output into `manifest.key` in Step 4. `key.pem` is the private
key: it never gets committed (see `.gitignore` below) and its canonical copy
goes to `~/p/vault`.

- [ ] **Step 3: Write the config files**

`package.json` scripts section:

```json
{
  "name": "brain-clipper",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "node build.mjs",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  }
}
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "types": ["chrome", "vitest/globals"],
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src", "tests", "build.mjs"]
}
```

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
  },
})
```

`tests/setup.ts` - the jsdom environment does not expose `crypto.subtle`, which
`sha256Hex` needs:

```ts
import { webcrypto } from 'node:crypto'

if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto })
}
```

`build.mjs`:

```js
import { build } from 'esbuild'
import { cp, mkdir, rm } from 'node:fs/promises'

await rm('dist', { recursive: true, force: true })
await mkdir('dist', { recursive: true })

await build({
  entryPoints: ['src/background/service-worker.ts'],
  outfile: 'dist/background/service-worker.js',
  bundle: true,
  format: 'esm',
  target: 'chrome120',
})

await cp('src/manifest.json', 'dist/manifest.json')
```

The build grows with the extension: Task 5 adds the options entry point and Task
8 adds the content entry point. Bundling entry points that do not exist yet
fails the build, so each task wires its own.

The format split matters when those land: the service worker is an ES module
(`"type": "module"` in the manifest), while an injected content script cannot be
one, so it is bundled as an IIFE.

`.gitignore`:

```
node_modules/
dist/
key.pem
```

- [ ] **Step 4: Write the manifest**

`src/manifest.json` - paste the base64 public key from Step 2 into `key`:

```json
{
  "manifest_version": 3,
  "name": "brain clipper",
  "version": "0.1.0",
  "description": "Clip the current page to markdown into the private brain-clips repo.",
  "key": "PASTE_BASE64_DER_PUBLIC_KEY_HERE",
  "permissions": ["activeTab", "scripting", "storage"],
  "host_permissions": ["https://api.github.com/*"],
  "background": {
    "service_worker": "background/service-worker.js",
    "type": "module"
  },
  "action": { "default_title": "Clip to brain" },
  "commands": {
    "clip-page": {
      "suggested_key": { "default": "Ctrl+Shift+S", "mac": "Command+Shift+S" },
      "description": "Clip current page to brain"
    }
  }
}
```

There is deliberately no `default_popup`: `chrome.action.onClicked` does not
fire when a popup is declared.

`options_page` is deliberately absent here and added in Task 5. Chrome validates
it at load time and refuses to load an extension whose options page file does
not exist, which would block loading unpacked until Task 5 lands.

- [ ] **Step 5: Write a placeholder service worker so the extension loads**

`src/background/service-worker.ts`:

```ts
chrome.runtime.onInstalled.addListener(() => {
  console.log('brain clipper installed')
})
```

- [ ] **Step 6: Build and load unpacked**

```bash
cd ~/p/brain-clipper && pnpm build
```

Open `chrome://extensions`, enable Developer mode, "Load unpacked", select
`~/p/brain-clipper/dist`. Expected: the extension loads with no errors, and its
id is stable (note it down; reloading from a copied directory must produce the
same id).

- [ ] **Step 7: Create the private repos and commit**

```bash
gh repo create BusiRocket/brain-clipper --private --source=. --remote=origin
gh repo create BusiRocket/brain-clips --private --add-readme
```

The `--add-readme` matters: the Git Data API misbehaves against a repo with no
commits.

```bash
cd ~/p/brain-clipper
git add -A
git commit -m "Bootstrap MV3 extension: build, manifest, stable key"
git push -u origin main
```

---

### Task 2: Domain model - ids, slugs, normalization, hashing, schemas

**Files:**

- Create: `src/shared/limits.ts`
- Create: `src/shared/new-clip-id.ts`
- Create: `src/shared/slugify.ts`
- Create: `src/shared/normalize-markdown.ts`
- Create: `src/shared/sha256-hex.ts`
- Create: `src/shared/clip-dir-name.ts`
- Create: `src/shared/clip-path.ts`
- Create: `src/shared/clip-metadata-schema.ts`
- Create: `src/shared/clip-state-schema.ts`
- Test: `tests/shared/slugify.test.ts`,
  `tests/shared/normalize-markdown.test.ts`, `tests/shared/sha256-hex.test.ts`,
  `tests/shared/clip-dir-name.test.ts`, `tests/shared/clip-path.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces:
  - `LIMITS` (const object with the byte caps and `MAX_DIR_NAME_CHARS`)
  - `newClipId(): string` (ULID, uppercase)
  - `slugify(input: string): string`
  - `normalizeMarkdown(input: string): string`
  - `sha256Hex(input: string): Promise<string>`
  - `clipDirName(input: { clippedAt: string; site: string; title: string; clipId: string }): string`
  - `clipPath(input: { clippedAt: string; dirName: string }): string`
  - `ClipMetadataSchema` / `type ClipMetadata`
  - `ClipStateSchema` / `type ClipState`

- [ ] **Step 1: Write the failing tests**

`tests/shared/slugify.test.ts`:

```ts
import { slugify } from '../../src/shared/slugify'

test('lowercases, strips accents and collapses separators', () => {
  expect(slugify('Agents Are Just Tools!')).toBe('agents-are-just-tools')
  expect(slugify('  Cafe  con  leche  ')).toBe('cafe-con-leche')
  expect(slugify('Espana / Portugal')).toBe('espana-portugal')
})

test('returns an empty string for input with no alphanumerics', () => {
  expect(slugify('***')).toBe('')
})
```

`tests/shared/normalize-markdown.test.ts`:

```ts
import { normalizeMarkdown } from '../../src/shared/normalize-markdown'

test('normalizes line endings, trailing spaces and blank runs', () => {
  expect(normalizeMarkdown('a  \r\n\r\n\r\n\r\nb   ')).toBe('a\n\nb\n')
})

test('is idempotent', () => {
  const once = normalizeMarkdown('# Title\r\n\r\n\r\ntext  \n')
  expect(normalizeMarkdown(once)).toBe(once)
})
```

`tests/shared/sha256-hex.test.ts`:

```ts
import { sha256Hex } from '../../src/shared/sha256-hex'

test('matches the known digest of "abc"', async () => {
  await expect(sha256Hex('abc')).resolves.toBe(
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  )
})
```

`tests/shared/clip-dir-name.test.ts`:

```ts
import { clipDirName } from '../../src/shared/clip-dir-name'
import { LIMITS } from '../../src/shared/limits'

const base = {
  clippedAt: '2026-07-26T14:03:11Z',
  site: 'simonwillison.net',
  title: 'Agents are just tools',
  clipId: '01J3ABCDEF123456789ABCDEFG',
}

test('builds date, site, title and id suffix', () => {
  expect(clipDirName(base)).toBe(
    '2026-07-26-simonwillison-net-agents-are-just-tools-01j3abcd',
  )
})

test('truncates the title so the leaf fits the cap, keeping the id suffix', () => {
  const name = clipDirName({ ...base, title: 'x'.repeat(400) })
  expect(name.length).toBeLessThanOrEqual(LIMITS.MAX_DIR_NAME_CHARS)
  expect(name.endsWith('-01j3abcd')).toBe(true)
})

test('bounds a pathological hostname too, not just the title', () => {
  const name = clipDirName({ ...base, site: `${'a'.repeat(200)}.example.com` })
  expect(name.length).toBeLessThanOrEqual(LIMITS.MAX_DIR_NAME_CHARS)
  expect(name.endsWith('-01j3abcd')).toBe(true)
})

test('a title that slugifies to nothing leaves no double separator', () => {
  expect(clipDirName({ ...base, title: '***' })).toBe(
    '2026-07-26-simonwillison-net-01j3abcd',
  )
})
```

`tests/shared/clip-path.test.ts`:

```ts
import { clipPath } from '../../src/shared/clip-path'

test('shards pending clips by capture year and month', () => {
  expect(
    clipPath({ clippedAt: '2026-07-26T14:03:11Z', dirName: 'a-b-c' }),
  ).toBe('clips/pending/2026/07/a-b-c')
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test` Expected: FAIL - every import resolves to a missing module.

- [ ] **Step 3: Implement the modules**

`src/shared/limits.ts`:

```ts
export const LIMITS = {
  MAX_GIT_BLOB_BYTES: 950_000,
  MAX_SOURCE_HTML_BYTES: 950_000,
  MAX_MARKDOWN_BYTES: 950_000,
  MAX_CLIP_BYTES: 15_000_000,
  MAX_DIR_NAME_CHARS: 96,
  MAX_SITE_SLUG_CHARS: 32,
} as const
```

`src/shared/new-clip-id.ts`:

```ts
import { ulid } from 'ulid'

export function newClipId(): string {
  return ulid()
}
```

`src/shared/slugify.ts`:

```ts
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
```

`src/shared/normalize-markdown.ts`:

```ts
export function normalizeMarkdown(input: string): string {
  const body = input
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\n+$/, '')
  return `${body}\n`
}
```

`src/shared/sha256-hex.ts`:

```ts
export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}
```

`src/shared/clip-dir-name.ts`:

```ts
import { LIMITS } from './limits'
import { slugify } from './slugify'

interface ClipDirNameInput {
  clippedAt: string
  site: string
  title: string
  clipId: string
}

export function clipDirName(input: ClipDirNameInput): string {
  const date = input.clippedAt.slice(0, 10)
  const suffix = input.clipId.slice(0, 8).toLowerCase()
  const site = slugify(input.site)
    .slice(0, LIMITS.MAX_SITE_SLUG_CHARS)
    .replace(/-+$/, '')
  const fixedLength = [date, site, suffix].filter(Boolean).join('-').length
  const budget = LIMITS.MAX_DIR_NAME_CHARS - fixedLength - 1
  const title =
    budget > 0 ? slugify(input.title).slice(0, budget).replace(/-+$/, '') : ''
  return [date, site, title, suffix].filter(Boolean).join('-')
}
```

Every variable-length part is bounded, not just the title: an absurdly long
hostname would otherwise blow past the cap on its own. Joining the non-empty
parts is what keeps a title that slugifies to nothing from leaving a double
separator before the id suffix.

`src/shared/clip-path.ts`:

```ts
interface ClipPathInput {
  clippedAt: string
  dirName: string
}

export function clipPath(input: ClipPathInput): string {
  const year = input.clippedAt.slice(0, 4)
  const month = input.clippedAt.slice(5, 7)
  return `clips/pending/${year}/${month}/${input.dirName}`
}
```

`src/shared/clip-metadata-schema.ts`:

```ts
import { z } from 'zod'

export const ClipMetadataSchema = z.object({
  schema_version: z.literal(1),
  clip_id: z.string().min(26),
  title: z.string(),
  url: z.string().url(),
  normalized_url: z.string().url(),
  canonical_url: z.string().url().nullable(),
  site: z.string(),
  author: z.string().nullable(),
  published: z.string().nullable(),
  language: z.string().nullable(),
  clipped_at: z.string(),
  clipped_from: z.string(),
  extension_version: z.string(),
  extractor: z.enum([
    'selection',
    'readability',
    'article',
    'main',
    'body',
    'innertext',
  ]),
  extractor_version: z.string(),
  snapshot_mode: z.enum(['extracted', 'sanitized', 'full-page']),
  sensitivity: z.enum(['public', 'private', 'restricted']),
  content_sha256: z.string().length(64),
  source_html_sha256: z.string().length(64),
  asset_count: z.number().int().nonnegative(),
  asset_failures: z.array(z.string()),
  note: z.string(),
  tags: z.array(z.string()),
  word_count: z.number().int().nonnegative(),
})

export type ClipMetadata = z.infer<typeof ClipMetadataSchema>
```

`src/shared/clip-state-schema.ts`:

```ts
import { z } from 'zod'

export const ClipStateSchema = z.object({
  status: z.enum(['pending', 'processed', 'needs-claude']),
  updatedAt: z.string(),
  failure: z.string().nullable(),
  brainCommit: z.string().nullable(),
})

export type ClipState = z.infer<typeof ClipStateSchema>
```

`asset_count`, `asset_failures`, `note` and `tags` exist in Phase 1 as fixed
empty values. They are part of the on-disk schema the later phases fill in;
keeping them now avoids a schema migration, and they are not backed by any code
that could grow into an asset pipeline.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test && pnpm typecheck` Expected: PASS, no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/shared tests/shared
git commit -m "Add clip domain model: ids, slugs, normalization, hashing, schemas"
```

---

### Task 3: Page extraction - selection, Readability, fallback chain, sanitizing, markdown

**Files:**

- Create: `src/content/get-selection-html.ts`
- Create: `src/content/extract-content.ts`
- Create: `src/content/sanitize-html.ts`
- Create: `src/content/to-markdown.ts`
- Create: `src/content/collect-page-metadata.ts`
- Test: `tests/content/extract-content.test.ts`,
  `tests/content/sanitize-html.test.ts`, `tests/content/to-markdown.test.ts`,
  `tests/content/collect-page-metadata.test.ts`
- Create fixtures: `tests/fixtures/blog.html`, `tests/fixtures/spa-shell.html`

**Interfaces:**

- Consumes: nothing from earlier tasks.
- Produces:
  - `getSelectionHtml(win: Window): string | null`
  - `extractContent(doc: Document, selectionHtml: string | null): { html: string; extractor: Extractor }`
    where
    `type Extractor = 'selection' | 'readability' | 'article' | 'main' | 'body' | 'innertext'`
  - `sanitizeHtml(html: string): string`
  - `toMarkdown(html: string): string`
  - `collectPageMetadata(doc: Document, url: string): { title: string; author: string | null; published: string | null; canonicalUrl: string | null; language: string | null; site: string }`

- [ ] **Step 1: Write the fixtures**

`tests/fixtures/blog.html` - a page with navigation that must not survive
extraction:

```html
<!doctype html>
<html lang="en">
  <head>
    <title>Agents are just tools</title>
    <link rel="canonical" href="https://example.com/agents" />
    <meta name="author" content="Simon Willison" />
    <meta property="article:published_time" content="2026-07-20T09:00:00Z" />
  </head>
  <body>
    <nav><a href="/">Home</a><a href="/about">About</a></nav>
    <article>
      <h1>Agents are just tools</h1>
      <p>First paragraph with a <a href="https://example.com/x">link</a>.</p>
      <p>
        Second paragraph that exists so Readability considers this real content
        rather than boilerplate, because short pages get rejected by its
        scoring.
      </p>
      <ul>
        <li>one</li>
        <li>two</li>
      </ul>
    </article>
    <footer>Copyright 2026</footer>
  </body>
</html>
```

`tests/fixtures/spa-shell.html` - no article, forces the tail of the chain:

```html
<!doctype html>
<html lang="en">
  <head>
    <title>Dashboard</title>
  </head>
  <body>
    <div id="root">Loading dashboard data for the current account.</div>
  </body>
</html>
```

- [ ] **Step 2: Write the failing tests**

`tests/content/extract-content.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { extractContent } from '../../src/content/extract-content'

function docFrom(fixture: string): Document {
  const html = readFileSync(`tests/fixtures/${fixture}`, 'utf8')
  return new DOMParser().parseFromString(html, 'text/html')
}

test('a selection wins over everything else', () => {
  const result = extractContent(docFrom('blog.html'), '<p>picked text</p>')
  expect(result.extractor).toBe('selection')
  expect(result.html).toContain('picked text')
})

test('a normal article goes through Readability and drops nav and footer', () => {
  const result = extractContent(docFrom('blog.html'), null)
  expect(result.extractor).toBe('readability')
  expect(result.html).toContain('First paragraph')
  expect(result.html).not.toContain('About')
  expect(result.html).not.toContain('Copyright 2026')
})

test('a page Readability rejects falls further down the chain', () => {
  const result = extractContent(docFrom('spa-shell.html'), null)
  expect(['body', 'innertext']).toContain(result.extractor)
  expect(result.html).toContain('Loading dashboard data')
})

test('extraction does not mutate the source document', () => {
  const doc = docFrom('blog.html')
  const script = doc.createElement('script')
  script.textContent = 'window.tracked = true'
  doc.body.appendChild(script)

  extractContent(doc, null)

  expect(doc.querySelector('nav')).not.toBeNull()
  expect(doc.querySelector('script')).not.toBeNull()
})

test('falls back to article when Readability rejects the page', () => {
  const doc = new DOMParser().parseFromString(
    '<html lang="en"><body><article><p>short</p></article></body></html>',
    'text/html',
  )
  const result = extractContent(doc, null)
  expect(result.extractor).toBe('article')
  expect(result.html).toContain('short')
})

test('falls back to main when there is no article', () => {
  const doc = new DOMParser().parseFromString(
    '<html lang="en"><body><main><p>short</p></main></body></html>',
    'text/html',
  )
  expect(extractContent(doc, null).extractor).toBe('main')
})

test('falls back to innertext when the body has only text', () => {
  const doc = new DOMParser().parseFromString(
    '<html lang="en"><body></body></html>',
    'text/html',
  )
  doc.body.textContent = 'bare text'
  const result = extractContent(doc, null)
  expect(result.extractor).toBe('innertext')
  expect(result.html).toContain('bare text')
})
```

`tests/content/sanitize-html.test.ts`:

```ts
import { sanitizeHtml } from '../../src/content/sanitize-html'

test('removes scripts, iframes, forms and event attributes', () => {
  const dirty = `
    <div onclick="steal()">
      <script>fetch('/secret')</script>
      <iframe src="https://evil.example"></iframe>
      <form action="/pay"><input name="csrf" value="TOKEN-123" /></form>
      <p>kept</p>
    </div>`
  const clean = sanitizeHtml(dirty)
  expect(clean).toContain('kept')
  expect(clean).not.toContain('script')
  expect(clean).not.toContain('iframe')
  expect(clean).not.toContain('TOKEN-123')
  expect(clean).not.toContain('onclick')
})
```

`tests/content/to-markdown.test.ts`:

```ts
import { toMarkdown } from '../../src/content/to-markdown'

test('converts headings, links and lists', () => {
  const md = toMarkdown(
    '<h1>Title</h1><p>See <a href="https://x.test">x</a>.</p><ul><li>one</li></ul>',
  )
  expect(md).toContain('# Title')
  expect(md).toContain('[x](https://x.test)')
  expect(md).toContain('-   one')
})

test('converts GFM tables', () => {
  const md = toMarkdown('<table><tr><th>a</th></tr><tr><td>1</td></tr></table>')
  expect(md).toContain('| a |')
})
```

`tests/content/collect-page-metadata.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { collectPageMetadata } from '../../src/content/collect-page-metadata'

test('reads title, author, published date, canonical and language', () => {
  const html = readFileSync('tests/fixtures/blog.html', 'utf8')
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const meta = collectPageMetadata(
    doc,
    'https://example.com/agents?utm_source=rss',
  )

  expect(meta.title).toBe('Agents are just tools')
  expect(meta.author).toBe('Simon Willison')
  expect(meta.published).toBe('2026-07-20T09:00:00Z')
  expect(meta.canonicalUrl).toBe('https://example.com/agents')
  expect(meta.language).toBe('en')
  expect(meta.site).toBe('example.com')
})
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `pnpm test` Expected: FAIL - missing modules.

- [ ] **Step 4: Implement the modules**

`src/content/get-selection-html.ts`:

```ts
export function getSelectionHtml(win: Window): string | null {
  const selection = win.getSelection()
  if (!selection || selection.isCollapsed || selection.rangeCount === 0)
    return null
  const container = win.document.createElement('div')
  for (let index = 0; index < selection.rangeCount; index += 1) {
    container.appendChild(selection.getRangeAt(index).cloneContents())
  }
  const html = container.innerHTML.trim()
  return html.length > 0 ? html : null
}
```

`src/content/extract-content.ts`:

```ts
import { Readability } from '@mozilla/readability'

export type Extractor =
  'selection' | 'readability' | 'article' | 'main' | 'body' | 'innertext'

export interface ExtractedContent {
  html: string
  extractor: Extractor
}

export function extractContent(
  doc: Document,
  selectionHtml: string | null,
): ExtractedContent {
  if (selectionHtml) return { html: selectionHtml, extractor: 'selection' }

  const clone = doc.cloneNode(true) as Document
  const article = new Readability(clone).parse()
  if (
    article?.content &&
    (article.textContent?.trim().length ?? 0) >= MIN_READABILITY_TEXT_LENGTH
  ) {
    return { html: article.content, extractor: 'readability' }
  }

  const articleEl = doc.querySelector('article')
  if (articleEl?.innerHTML.trim())
    return { html: articleEl.innerHTML, extractor: 'article' }

  const mainEl = doc.querySelector('main, [role="main"]')
  if (mainEl?.innerHTML.trim())
    return { html: mainEl.innerHTML, extractor: 'main' }

  const body = doc.body
  if (body?.innerHTML.trim() && body.children.length > 0) {
    return { html: body.innerHTML, extractor: 'body' }
  }

  return {
    html: `<p>${doc.body?.textContent?.trim() ?? ''}</p>`,
    extractor: 'innertext',
  }
}
```

Readability mutates the document it is given, which is why it receives a clone -
the page the user is looking at must not change.

`MIN_READABILITY_TEXT_LENGTH = 100`, declared in `extract-content.ts`.
Readability never returns null for an app shell: its internal fallback keeps the
best non-empty attempt regardless of its own `charThreshold`, so a 49-character
`<div id="root">` wrapper comes back looking like an article. The length gate is
what sends those pages down the chain instead of mislabelling them
`extractor: readability`.

`src/content/sanitize-html.ts`:

```ts
import DOMPurify from 'dompurify'

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    FORBID_TAGS: [
      'script',
      'style',
      'iframe',
      'form',
      'input',
      'textarea',
      'select',
      'button',
      'object',
      'embed',
      'link',
      'meta',
    ],
    FORBID_ATTR: ['style'],
    ALLOW_DATA_ATTR: false,
    KEEP_CONTENT: true,
  })
}
```

DOMPurify already strips every `on*` handler; the forbid lists cover the
containers that carry tokens and hydration state.

`src/types/turndown-plugin-gfm.d.ts` - the plugin ships no types:

```ts
declare module 'turndown-plugin-gfm' {
  import TurndownService = require('turndown')
  export function gfm(service: TurndownService): void
  export function tables(service: TurndownService): void
  export function strikethrough(service: TurndownService): void
  export function taskListItems(service: TurndownService): void
}
```

The `import ... = require()` form matters: `@types/turndown` uses `export =`, so
a `/// <reference types="turndown" />` directive does not bring the class name
into the ambient module's scope and every signature silently degrades to an
error type that `skipLibCheck: true` then hides.

`src/content/to-markdown.ts`:

```ts
import TurndownService from 'turndown'
import { gfm } from 'turndown-plugin-gfm'

export function toMarkdown(html: string): string {
  const service = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
  })
  service.use(gfm)
  return service.turndown(html)
}
```

`src/content/collect-page-metadata.ts`:

```ts
export interface PageMetadata {
  title: string
  author: string | null
  published: string | null
  canonicalUrl: string | null
  language: string | null
  site: string
}

function meta(doc: Document, selector: string): string | null {
  return doc.querySelector(selector)?.getAttribute('content')?.trim() || null
}

export function collectPageMetadata(doc: Document, url: string): PageMetadata {
  return {
    title: meta(doc, 'meta[property="og:title"]') ?? doc.title.trim(),
    author:
      meta(doc, 'meta[name="author"]') ??
      meta(doc, 'meta[property="article:author"]'),
    published:
      meta(doc, 'meta[property="article:published_time"]') ??
      doc.querySelector('time[datetime]')?.getAttribute('datetime') ??
      null,
    canonicalUrl:
      doc.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
    language: doc.documentElement.getAttribute('lang'),
    site: new URL(url).hostname,
  }
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm test && pnpm typecheck` Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/content tests/content tests/fixtures
git commit -m "Add page extraction: selection, Readability chain, sanitizing, markdown"
```

---

### Task 4: Clip assembly - frontmatter and the four files

**Files:**

- Create: `src/shared/normalize-url.ts`
- Create: `src/shared/build-frontmatter.ts`
- Create: `src/shared/build-clip-files.ts`
- Test: `tests/shared/build-frontmatter.test.ts`,
  `tests/shared/build-clip-files.test.ts`

**Interfaces:**

- Consumes: `LIMITS`, `sha256Hex`, `normalizeMarkdown`, `clipDirName`,
  `clipPath`, `ClipMetadata`, `ClipState` (Task 2).
- Produces:
  - `normalizeUrl(url: string): string` - strips `utm_*`, `fbclid`, `gclid` and
    the fragment
  - `buildFrontmatter(metadata: ClipMetadata): string` - the `---` delimited
    YAML block
  - `buildClipFiles(input: BuildClipFilesInput): Promise<ClipFiles>` where

```ts
interface BuildClipFilesInput {
  clipId: string
  url: string
  markdown: string
  sourceHtml: string
  snapshotMode: 'extracted' | 'sanitized' | 'full-page'
  extractor: Extractor
  page: PageMetadata
  clippedAt: string
  clippedFrom: string
  extensionVersion: string
}

interface ClipFiles {
  dirPath: string
  files: Record<string, string>
  metadata: ClipMetadata
}
```

- [ ] **Step 1: Write the failing tests**

`tests/shared/build-frontmatter.test.ts`:

```ts
import { load } from 'js-yaml'
import { buildFrontmatter } from '../../src/shared/build-frontmatter'
import type { ClipMetadata } from '../../src/shared/clip-metadata-schema'

const metadata = {
  schema_version: 1,
  clip_id: '01J3ABCDEF123456789ABCDEFG',
  title: 'Why: "agents" are tools - a note\non two lines',
  url: 'https://example.com/a',
  normalized_url: 'https://example.com/a',
  canonical_url: null,
  site: 'example.com',
  author: null,
  published: null,
  language: 'en',
  clipped_at: '2026-07-26T14:03:11Z',
  clipped_from: 'mac-cristian',
  extension_version: '0.1.0',
  extractor: 'readability',
  extractor_version: '0.6.0',
  snapshot_mode: 'sanitized',
  sensitivity: 'public',
  content_sha256: 'a'.repeat(64),
  source_html_sha256: 'b'.repeat(64),
  asset_count: 0,
  asset_failures: [],
  note: '',
  tags: [],
  word_count: 12,
} satisfies ClipMetadata

test('a hostile title still round-trips as valid YAML', () => {
  const block = buildFrontmatter(metadata)
  const body = block.replace(/^---\n/, '').replace(/---\n$/, '')
  const parsed = load(body) as ClipMetadata
  expect(parsed.title).toBe(metadata.title)
  expect(parsed.clip_id).toBe(metadata.clip_id)
})

test('the block is delimited and ends with a newline', () => {
  const block = buildFrontmatter(metadata)
  expect(block.startsWith('---\n')).toBe(true)
  expect(block.endsWith('---\n')).toBe(true)
})
```

`tests/shared/build-clip-files.test.ts`:

```ts
import { load } from 'js-yaml'
import { buildClipFiles } from '../../src/shared/build-clip-files'
import { sha256Hex } from '../../src/shared/sha256-hex'
import { normalizeMarkdown } from '../../src/shared/normalize-markdown'

const input = {
  clipId: '01J3ABCDEF123456789ABCDEFG',
  url: 'https://example.com/agents?utm_source=rss#section',
  markdown: '# Title\r\n\r\n\r\nBody text  \n',
  sourceHtml: '<p>Body text</p>',
  snapshotMode: 'sanitized' as const,
  extractor: 'readability' as const,
  page: {
    title: 'Agents are just tools',
    author: 'Simon Willison',
    published: '2026-07-20T09:00:00Z',
    canonicalUrl: 'https://example.com/agents',
    language: 'en',
    site: 'example.com',
  },
  clippedAt: '2026-07-26T14:03:11Z',
  clippedFrom: 'mac-cristian',
  extensionVersion: '0.1.0',
}

test('emits exactly the four clip files under a sharded pending path', async () => {
  const clip = await buildClipFiles(input)
  expect(clip.dirPath).toBe(
    'clips/pending/2026/07/2026-07-26-example-com-agents-are-just-tools-01j3abcd',
  )
  expect(Object.keys(clip.files).sort()).toEqual([
    `${clip.dirPath}/index.md`,
    `${clip.dirPath}/metadata.json`,
    `${clip.dirPath}/source.html`,
    `${clip.dirPath}/state.json`,
  ])
})

test('content_sha256 covers the normalized body only, not the frontmatter', async () => {
  const clip = await buildClipFiles(input)
  const expected = await sha256Hex(normalizeMarkdown(input.markdown))
  expect(clip.metadata.content_sha256).toBe(expected)

  const later = await buildClipFiles({
    ...input,
    clippedAt: '2027-01-01T00:00:00Z',
  })
  expect(later.metadata.content_sha256).toBe(expected)
})

test('strips tracking parameters into normalized_url and keeps the original url', async () => {
  const clip = await buildClipFiles(input)
  expect(clip.metadata.url).toBe(input.url)
  expect(clip.metadata.normalized_url).toBe('https://example.com/agents')
})

test('index.md is frontmatter followed by the normalized body', async () => {
  const clip = await buildClipFiles(input)
  const indexMd = clip.files[`${clip.dirPath}/index.md`] as string
  const [frontmatter, rest] = indexMd.replace(/^---\n/, '').split('\n---\n')

  expect((load(frontmatter as string) as { title: string }).title).toBe(
    'Agents are just tools',
  )
  expect(rest).toBe(`\n${normalizeMarkdown(input.markdown)}`)
})

test('state.json starts as pending with no failure and no brain commit', async () => {
  const clip = await buildClipFiles(input)
  const state = JSON.parse(clip.files[`${clip.dirPath}/state.json`] as string)
  expect(state).toEqual({
    status: 'pending',
    updatedAt: '2026-07-26T14:03:11Z',
    failure: null,
    brainCommit: null,
  })
})

test('rejects a clip whose markdown exceeds the cap', async () => {
  await expect(
    buildClipFiles({ ...input, markdown: 'x'.repeat(1_000_000) }),
  ).rejects.toThrow(/markdown/i)
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test` Expected: FAIL - missing modules.

- [ ] **Step 3: Implement the modules**

`src/shared/normalize-url.ts`:

```ts
const TRACKING_PREFIXES = ['utm_']
const TRACKING_KEYS = ['fbclid', 'gclid', 'mc_cid', 'mc_eid', 'ref_src']

export function normalizeUrl(url: string): string {
  const parsed = new URL(url)
  parsed.hash = ''
  for (const key of [...parsed.searchParams.keys()]) {
    const isTracking =
      TRACKING_PREFIXES.some((prefix) => key.startsWith(prefix)) ||
      TRACKING_KEYS.includes(key)
    if (isTracking) parsed.searchParams.delete(key)
  }
  return parsed.toString().replace(/\?$/, '')
}
```

`src/shared/build-frontmatter.ts`:

```ts
import { dump } from 'js-yaml'
import type { ClipMetadata } from './clip-metadata-schema'

export function buildFrontmatter(metadata: ClipMetadata): string {
  const yaml = dump(metadata, {
    lineWidth: -1,
    noRefs: true,
    quoteStyle: 'double',
  })
  return `---\n${yaml}---\n`
}
```

`src/shared/build-clip-files.ts`:

```ts
import type { Extractor } from '../content/extract-content'
import type { PageMetadata } from '../content/collect-page-metadata'
import { ClipMetadataSchema, type ClipMetadata } from './clip-metadata-schema'
import { ClipStateSchema } from './clip-state-schema'
import { LIMITS } from './limits'
import { buildFrontmatter } from './build-frontmatter'
import { clipDirName } from './clip-dir-name'
import { clipPath } from './clip-path'
import { normalizeMarkdown } from './normalize-markdown'
import { normalizeUrl } from './normalize-url'
import { sha256Hex } from './sha256-hex'

export interface BuildClipFilesInput {
  clipId: string
  url: string
  markdown: string
  sourceHtml: string
  snapshotMode: 'extracted' | 'sanitized' | 'full-page'
  extractor: Extractor
  page: PageMetadata
  clippedAt: string
  clippedFrom: string
  extensionVersion: string
}

export interface ClipFiles {
  dirPath: string
  files: Record<string, string>
  metadata: ClipMetadata
}

const READABILITY_VERSION = '0.6.0'

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length
}

export async function buildClipFiles(
  input: BuildClipFilesInput,
): Promise<ClipFiles> {
  const body = normalizeMarkdown(input.markdown)
  if (byteLength(body) > LIMITS.MAX_MARKDOWN_BYTES) {
    throw new Error(`markdown exceeds ${LIMITS.MAX_MARKDOWN_BYTES} bytes`)
  }
  if (byteLength(input.sourceHtml) > LIMITS.MAX_SOURCE_HTML_BYTES) {
    throw new Error(`source html exceeds ${LIMITS.MAX_SOURCE_HTML_BYTES} bytes`)
  }

  const metadata = ClipMetadataSchema.parse({
    schema_version: 1,
    clip_id: input.clipId,
    title: input.page.title,
    url: input.url,
    normalized_url: normalizeUrl(input.url),
    canonical_url: input.page.canonicalUrl,
    site: input.page.site,
    author: input.page.author,
    published: input.page.published,
    language: input.page.language,
    clipped_at: input.clippedAt,
    clipped_from: input.clippedFrom,
    extension_version: input.extensionVersion,
    extractor: input.extractor,
    extractor_version: READABILITY_VERSION,
    snapshot_mode: input.snapshotMode,
    sensitivity: 'public',
    content_sha256: await sha256Hex(body),
    source_html_sha256: await sha256Hex(input.sourceHtml),
    asset_count: 0,
    asset_failures: [],
    note: '',
    tags: [],
    word_count: body.split(/\s+/).filter(Boolean).length,
  } satisfies ClipMetadata)

  const state = ClipStateSchema.parse({
    status: 'pending',
    updatedAt: input.clippedAt,
    failure: null,
    brainCommit: null,
  })

  const dirPath = clipPath({
    clippedAt: input.clippedAt,
    dirName: clipDirName({
      clippedAt: input.clippedAt,
      site: input.page.site,
      title: input.page.title,
      clipId: input.clipId,
    }),
  })

  const files: Record<string, string> = {
    [`${dirPath}/index.md`]: `${buildFrontmatter(metadata)}\n${body}`,
    [`${dirPath}/source.html`]: input.sourceHtml,
    [`${dirPath}/metadata.json`]: `${JSON.stringify(metadata, null, 2)}\n`,
    [`${dirPath}/state.json`]: `${JSON.stringify(state, null, 2)}\n`,
  }

  const total = Object.values(files).reduce(
    (sum, value) => sum + byteLength(value),
    0,
  )
  if (total > LIMITS.MAX_CLIP_BYTES)
    throw new Error(`clip exceeds ${LIMITS.MAX_CLIP_BYTES} bytes`)

  return { dirPath, files, metadata }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test && pnpm typecheck` Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/shared tests/shared
git commit -m "Assemble clip files: frontmatter, metadata, state, content hashing"
```

---

### Task 5: Settings and token storage, options page

**Files:**

- Create: `src/shared/settings-schema.ts`
- Create: `src/shared/get-settings.ts`
- Create: `src/shared/set-settings.ts`
- Create: `src/shared/get-token.ts`
- Create: `src/shared/set-token.ts`
- Create: `src/shared/clear-token.ts`
- Create: `src/shared/harden-token-storage.ts`
- Create: `src/options/options.html`
- Create: `src/options/options.ts`
- Test: `tests/shared/settings.test.ts`, `tests/shared/token.test.ts`
- Create: `tests/chrome-mock.ts`

**Interfaces:**

- Consumes: nothing from earlier tasks.
- Produces:
  - `SettingsSchema` /
    `type Settings = { owner: string; repo: string; branch: string; machineName: string }`
  - `getSettings(): Promise<Settings | null>`,
    `setSettings(settings: Settings): Promise<void>`
  - `getToken(): Promise<string | null>`,
    `setToken(token: string): Promise<void>`, `clearToken(): Promise<void>`
  - `hardenTokenStorage(): Promise<void>`

- [ ] **Step 1: Write the chrome mock and the failing tests**

`tests/chrome-mock.ts`:

```ts
interface Store {
  data: Record<string, unknown>
  accessLevel: string | null
}

export function installChromeMock(): { sync: Store; local: Store } {
  const sync: Store = { data: {}, accessLevel: null }
  const local: Store = { data: {}, accessLevel: null }

  const area = (store: Store) => ({
    get: async (keys: string[]) =>
      Object.fromEntries(
        keys
          .map((key) => [key, store.data[key]])
          .filter(([, v]) => v !== undefined),
      ),
    set: async (items: Record<string, unknown>) => {
      Object.assign(store.data, items)
    },
    remove: async (key: string) => {
      delete store.data[key]
    },
    setAccessLevel: async ({ accessLevel }: { accessLevel: string }) => {
      store.accessLevel = accessLevel
    },
  })

  ;(globalThis as unknown as { chrome: unknown }).chrome = {
    storage: { sync: area(sync), local: area(local) },
  }

  return { sync, local }
}
```

`tests/shared/settings.test.ts`:

```ts
import { installChromeMock } from '../chrome-mock'
import { getSettings } from '../../src/shared/get-settings'
import { setSettings } from '../../src/shared/set-settings'

test('round-trips settings through sync storage', async () => {
  const stores = installChromeMock()
  await setSettings({
    owner: 'BusiRocket',
    repo: 'brain-clips',
    branch: 'main',
    machineName: 'mac-cristian',
  })

  expect(await getSettings()).toEqual({
    owner: 'BusiRocket',
    repo: 'brain-clips',
    branch: 'main',
    machineName: 'mac-cristian',
  })
  expect(stores.local.data).toEqual({})
})

test('returns null when settings are incomplete', async () => {
  installChromeMock()
  expect(await getSettings()).toBeNull()
})
```

`tests/shared/token.test.ts`:

```ts
import { installChromeMock } from '../chrome-mock'
import { getToken } from '../../src/shared/get-token'
import { setToken } from '../../src/shared/set-token'
import { clearToken } from '../../src/shared/clear-token'
import { hardenTokenStorage } from '../../src/shared/harden-token-storage'

test('the token lives in local storage and never in sync', async () => {
  const stores = installChromeMock()
  await setToken('github_pat_example')

  expect(await getToken()).toBe('github_pat_example')
  expect(JSON.stringify(stores.sync.data)).not.toContain('github_pat_example')
})

test('clearing removes it', async () => {
  installChromeMock()
  await setToken('github_pat_example')
  await clearToken()
  expect(await getToken()).toBeNull()
})

test('hardening restricts local storage to trusted contexts', async () => {
  const stores = installChromeMock()
  await hardenTokenStorage()
  expect(stores.local.accessLevel).toBe('TRUSTED_CONTEXTS')
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test` Expected: FAIL - missing modules.

- [ ] **Step 3: Implement storage**

`src/shared/settings-schema.ts`:

```ts
import { z } from 'zod'

export const SettingsSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  branch: z.string().min(1),
  machineName: z.string().min(1),
})

export type Settings = z.infer<typeof SettingsSchema>
```

`src/shared/get-settings.ts`:

```ts
import { SettingsSchema, type Settings } from './settings-schema'

export async function getSettings(): Promise<Settings | null> {
  const stored = await chrome.storage.sync.get([
    'owner',
    'repo',
    'branch',
    'machineName',
  ])
  const parsed = SettingsSchema.safeParse(stored)
  return parsed.success ? parsed.data : null
}
```

`src/shared/set-settings.ts`:

```ts
import { SettingsSchema, type Settings } from './settings-schema'

export async function setSettings(settings: Settings): Promise<void> {
  await chrome.storage.sync.set(SettingsSchema.parse(settings))
}
```

`src/shared/get-token.ts`:

```ts
const TOKEN_KEY = 'githubToken'

export async function getToken(): Promise<string | null> {
  const stored = await chrome.storage.local.get([TOKEN_KEY])
  const token = stored[TOKEN_KEY]
  return typeof token === 'string' && token.length > 0 ? token : null
}
```

`src/shared/set-token.ts`:

```ts
export async function setToken(token: string): Promise<void> {
  await chrome.storage.local.set({ githubToken: token })
}
```

`src/shared/clear-token.ts`:

```ts
export async function clearToken(): Promise<void> {
  await chrome.storage.local.remove('githubToken')
}
```

`src/shared/harden-token-storage.ts`:

```ts
export async function hardenTokenStorage(): Promise<void> {
  await chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' })
}
```

By default `local` and `sync` are `TRUSTED_AND_UNTRUSTED_CONTEXTS`, which means
a content script injected into a page can read them. The token has no business
being reachable from there.

- [ ] **Step 4: Write the options page**

`src/options/options.html`:

```html
<!doctype html>
<meta charset="utf-8" />
<title>brain clipper settings</title>
<style>
  body {
    margin: 2rem;
    max-width: 34rem;
    font:
      14px system-ui,
      sans-serif;
  }
  label {
    display: block;
    margin: 0.75rem 0 0.25rem;
  }
  input {
    padding: 0.4rem;
    width: 100%;
  }
  .row {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
  }
  #status {
    margin-top: 1rem;
    min-height: 1.2em;
  }
</style>
<h1>brain clipper</h1>
<label for="owner">Owner</label><input id="owner" />
<label for="repo">Repo</label><input id="repo" />
<label for="branch">Branch</label><input id="branch" />
<label for="machineName">Machine name</label><input id="machineName" />
<label for="token">GitHub token (stored on this device only)</label>
<input id="token" type="password" autocomplete="off" />
<div class="row">
  <button id="save">Save</button>
  <button id="removeToken">Remove token from this device</button>
  <button id="openGithub">Open GitHub to revoke token</button>
</div>
<p id="status"></p>
<script src="options.js"></script>
```

`src/options/options.ts`:

```ts
import { getSettings } from '../shared/get-settings'
import { setSettings } from '../shared/set-settings'
import { getToken } from '../shared/get-token'
import { setToken } from '../shared/set-token'
import { clearToken } from '../shared/clear-token'
import { SettingsSchema } from '../shared/settings-schema'

const REVOKE_URL = 'https://github.com/settings/personal-access-tokens'

function field(id: string): HTMLInputElement {
  return document.getElementById(id) as HTMLInputElement
}

function say(message: string): void {
  ;(document.getElementById('status') as HTMLElement).textContent = message
}

async function load(): Promise<void> {
  const settings = await getSettings()
  field('owner').value = settings?.owner ?? 'BusiRocket'
  field('repo').value = settings?.repo ?? 'brain-clips'
  field('branch').value = settings?.branch ?? 'main'
  field('machineName').value = settings?.machineName ?? ''
  field('token').value = (await getToken()) ? '********' : ''
}

document.getElementById('save')?.addEventListener('click', async () => {
  const parsed = SettingsSchema.safeParse({
    owner: field('owner').value.trim(),
    repo: field('repo').value.trim(),
    branch: field('branch').value.trim(),
    machineName: field('machineName').value.trim(),
  })
  if (!parsed.success) return say('All settings fields are required.')
  await setSettings(parsed.data)

  const token = field('token').value.trim()
  if (token && token !== '********') await setToken(token)
  say('Saved.')
})

document.getElementById('removeToken')?.addEventListener('click', async () => {
  await clearToken()
  field('token').value = ''
  say(
    'Token removed from this device. It is still valid on GitHub until revoked there.',
  )
})

document.getElementById('openGithub')?.addEventListener('click', () => {
  void chrome.tabs.create({ url: REVOKE_URL })
})

void load()
```

The two buttons are labelled honestly: deleting `chrome.storage.local` is not
revocation, and only GitHub can revoke.

- [ ] **Step 5: Declare the options page and extend the build**

Add to `src/manifest.json`, after the `action` entry:

```json
  "options_page": "options/options.html",
```

It was withheld in Task 1 because Chrome refuses to load an extension whose
declared options page is missing from `dist/`.

Append to `build.mjs`, before the `cp` of the manifest:

```js
await build({
  entryPoints: ['src/options/options.ts'],
  outdir: 'dist',
  outbase: 'src',
  bundle: true,
  format: 'iife',
  target: 'chrome120',
})

await mkdir('dist/options', { recursive: true })
await cp('src/options/options.html', 'dist/options/options.html')
```

- [ ] **Step 6: Run the tests and build**

Run: `pnpm test && pnpm typecheck && pnpm build` Expected: PASS;
`dist/options/options.html` and `dist/options/options.js` exist.

- [ ] **Step 7: Commit**

```bash
git add src/shared src/options tests
git commit -m "Add settings and device-local token storage with options page"
```

---

### Task 6: GitHub Git Data API primitives

**Files:**

- Create: `src/background/github-fetch.ts`
- Create: `src/background/get-head-commit.ts`
- Create: `src/background/create-blob.ts`
- Create: `src/background/create-tree.ts`
- Create: `src/background/create-commit.ts`
- Create: `src/background/update-ref.ts`
- Create: `src/background/not-fast-forward-error.ts`
- Create: `src/background/check-existing-clip.ts`
- Test: `tests/background/github-primitives.test.ts`,
  `tests/background/check-existing-clip.test.ts`

**Interfaces:**

- Consumes: `Settings` (Task 5), `ClipMetadata` (Task 2).
- Produces (all take
  `context: GithubContext = { token: string; owner: string; repo: string }`):
  - `githubFetch(context, path, init?): Promise<Response>`
  - `getHeadCommit(context, branch): Promise<{ commitSha: string; treeSha: string }>`
  - `createBlob(context, content): Promise<string>` - returns blob sha
  - `createTree(context, baseTreeSha, entries: Array<{ path: string; sha: string }>): Promise<string>`
  - `createCommit(context, input: { message: string; treeSha: string; parentSha: string }): Promise<string>`
  - `updateRef(context, branch, commitSha): Promise<void>` - throws
    `NotFastForwardError`
  - `checkExistingClip(context, input: { branch: string; dirPath: string; clipId: string; contentSha256: string }): Promise<'absent' | 'identical' | 'conflict'>`

- [ ] **Step 1: Write the failing tests**

`tests/background/github-primitives.test.ts`:

```ts
import { getHeadCommit } from '../../src/background/get-head-commit'
import { createBlob } from '../../src/background/create-blob'
import { createTree } from '../../src/background/create-tree'
import { createCommit } from '../../src/background/create-commit'
import { updateRef } from '../../src/background/update-ref'
import { NotFastForwardError } from '../../src/background/not-fast-forward-error'

const context = { token: 't', owner: 'o', repo: 'r' }

function mockFetch(
  handler: (url: string, init: RequestInit) => Response,
): void {
  globalThis.fetch = vi.fn(
    async (url: string | URL | Request, init?: RequestInit) =>
      handler(String(url), init ?? {}),
  ) as unknown as typeof fetch
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

test('getHeadCommit resolves the branch ref and its tree', async () => {
  const seen: string[] = []
  mockFetch((url) => {
    seen.push(url)
    if (url.endsWith('/git/ref/heads/main'))
      return json({ object: { sha: 'commit1' } })
    if (url.endsWith('/git/commits/commit1'))
      return json({ sha: 'commit1', tree: { sha: 'tree1' } })
    throw new Error(`unexpected ${url}`)
  })

  await expect(getHeadCommit(context, 'main')).resolves.toEqual({
    commitSha: 'commit1',
    treeSha: 'tree1',
  })
  expect(seen).toEqual([
    'https://api.github.com/repos/o/r/git/ref/heads/main',
    'https://api.github.com/repos/o/r/git/commits/commit1',
  ])
})

test('createBlob posts utf-8 content and returns the sha', async () => {
  let body: unknown
  mockFetch((url, init) => {
    body = JSON.parse(String(init.body))
    expect(url).toBe('https://api.github.com/repos/o/r/git/blobs')
    return json({ sha: 'blob1' })
  })

  await expect(createBlob(context, '# hello')).resolves.toBe('blob1')
  expect(body).toEqual({ content: '# hello', encoding: 'utf-8' })
})

test('createTree sends 100644 entries against a base tree', async () => {
  let body:
    { base_tree: string; tree: Array<Record<string, string>> } | undefined
  mockFetch((_url, init) => {
    body = JSON.parse(String(init.body))
    return json({ sha: 'tree2' })
  })

  await expect(
    createTree(context, 'tree1', [{ path: 'a/index.md', sha: 'blob1' }]),
  ).resolves.toBe('tree2')
  expect(body?.base_tree).toBe('tree1')
  expect(body?.tree[0]).toEqual({
    path: 'a/index.md',
    mode: '100644',
    type: 'blob',
    sha: 'blob1',
  })
})

test('createCommit sends the parent and returns the new sha', async () => {
  let body: { parents: string[] } | undefined
  mockFetch((_url, init) => {
    body = JSON.parse(String(init.body))
    return json({ sha: 'commit2' })
  })

  await expect(
    createCommit(context, {
      message: 'Clip',
      treeSha: 'tree2',
      parentSha: 'commit1',
    }),
  ).resolves.toBe('commit2')
  expect(body?.parents).toEqual(['commit1'])
})

test('every request carries the auth, accept and api-version headers', async () => {
  let headers: Record<string, string> | undefined
  mockFetch((_url, init) => {
    headers = init.headers as Record<string, string>
    return json({ sha: 'blob1' })
  })

  await createBlob(context, '# hello')
  expect(headers?.authorization).toBe('Bearer t')
  expect(headers?.accept).toBe('application/vnd.github+json')
  expect(headers?.['x-github-api-version']).toBe('2022-11-28')
})

test('createTree and createCommit hit their own endpoints', async () => {
  const urls: string[] = []
  mockFetch((url) => {
    urls.push(url)
    return json({ sha: 'x' })
  })

  await createTree(context, 'tree1', [{ path: 'a', sha: 'b' }])
  await createCommit(context, { message: 'm', treeSha: 't', parentSha: 'p' })
  expect(urls).toEqual([
    'https://api.github.com/repos/o/r/git/trees',
    'https://api.github.com/repos/o/r/git/commits',
  ])
})

test('updateRef PATCHes the branch ref with a non-forced sha', async () => {
  let seen: { url: string; method?: string; body: unknown } | undefined
  mockFetch((url, init) => {
    seen = { url, method: init.method, body: JSON.parse(String(init.body)) }
    return json({})
  })

  await updateRef(context, 'main', 'commit2')
  expect(seen?.url).toBe('https://api.github.com/repos/o/r/git/refs/heads/main')
  expect(seen?.method).toBe('PATCH')
  expect(seen?.body).toEqual({ sha: 'commit2', force: false })
})

test('a branch name with a slash keeps its separator and escapes the rest', async () => {
  const urls: string[] = []
  mockFetch((url) => {
    urls.push(url)
    return url.includes('/git/ref/')
      ? json({ object: { sha: 'c1' } })
      : json({ sha: 'c1', tree: { sha: 't1' } })
  })

  await getHeadCommit(context, 'feature/a&b')
  expect(urls[0]).toBe(
    'https://api.github.com/repos/o/r/git/ref/heads/feature/a%26b',
  )
})

test('updateRef throws NotFastForwardError on 422', async () => {
  mockFetch(() => json({ message: 'Update is not a fast forward' }, 422))
  await expect(updateRef(context, 'main', 'commit2')).rejects.toBeInstanceOf(
    NotFastForwardError,
  )
})

test('updateRef throws NotFastForwardError on 409', async () => {
  mockFetch(() => json({ message: 'Conflict' }, 409))
  await expect(updateRef(context, 'main', 'commit2')).rejects.toBeInstanceOf(
    NotFastForwardError,
  )
})

test('updateRef surfaces other errors as plain failures', async () => {
  mockFetch(() => json({ message: 'Bad credentials' }, 401))
  await expect(updateRef(context, 'main', 'commit2')).rejects.toThrow(/401/)
})
```

`tests/background/check-existing-clip.test.ts`:

```ts
import { checkExistingClip } from '../../src/background/check-existing-clip'

const context = { token: 't', owner: 'o', repo: 'r' }
const base = {
  branch: 'main',
  dirPath: 'clips/pending/2026/07/x',
  clipId: 'ID1',
  contentSha256: 'a'.repeat(64),
}

function mockMetadata(metadata: unknown | null, status = 200): void {
  globalThis.fetch = vi.fn(async () =>
    metadata === null
      ? new Response('{"message":"Not Found"}', { status: 404 })
      : new Response(JSON.stringify(metadata), {
          status,
          headers: { 'content-type': 'application/json' },
        }),
  ) as unknown as typeof fetch
}

test('absent when metadata.json is a 404', async () => {
  mockMetadata(null)
  await expect(checkExistingClip(context, base)).resolves.toBe('absent')
})

test('reads the clip metadata.json on the target branch as raw content', async () => {
  let seen: { url: string; accept: string } | undefined
  globalThis.fetch = vi.fn(
    async (url: string | URL | Request, init?: RequestInit) => {
      const headers = (init?.headers ?? {}) as Record<string, string>
      seen = { url: String(url), accept: headers.accept as string }
      return new Response('{"message":"Not Found"}', { status: 404 })
    },
  ) as unknown as typeof fetch

  await checkExistingClip(context, { ...base, branch: 'feature/a&b' })
  expect(seen?.url).toBe(
    'https://api.github.com/repos/o/r/contents/clips/pending/2026/07/x/metadata.json?ref=feature%2Fa%26b',
  )
  expect(seen?.accept).toBe('application/vnd.github.raw+json')
})

test('identical when clip id and content hash both match', async () => {
  mockMetadata({ clip_id: 'ID1', content_sha256: 'a'.repeat(64) })
  await expect(checkExistingClip(context, base)).resolves.toBe('identical')
})

test('conflict when the path holds a different clip', async () => {
  mockMetadata({ clip_id: 'OTHER', content_sha256: 'b'.repeat(64) })
  await expect(checkExistingClip(context, base)).resolves.toBe('conflict')
})

test('conflict when the same clip id holds different content', async () => {
  mockMetadata({ clip_id: 'ID1', content_sha256: 'b'.repeat(64) })
  await expect(checkExistingClip(context, base)).resolves.toBe('conflict')
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test` Expected: FAIL - missing modules.

- [ ] **Step 3: Implement the primitives**

`src/background/github-fetch.ts`:

```ts
export interface GithubContext {
  token: string
  owner: string
  repo: string
}

export async function githubFetch(
  context: GithubContext,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(
    `https://api.github.com/repos/${context.owner}/${context.repo}${path}`,
    {
      ...init,
      headers: {
        accept: 'application/vnd.github+json',
        authorization: `Bearer ${context.token}`,
        'x-github-api-version': '2022-11-28',
        'content-type': 'application/json',
        ...(init.headers ?? {}),
      },
    },
  )
}
```

`src/background/encode-branch-path.ts` - a branch name is interpolated into URL
paths, and it is settings-supplied, so it has to be encoded. Not with a single
`encodeURIComponent`: that would escape the separator in a nested name like
`feature/x` and address a branch that does not exist. Encode per segment:

```ts
export function encodeBranchPath(branch: string): string {
  return branch.split('/').map(encodeURIComponent).join('/')
}
```

`src/background/get-head-commit.ts`:

```ts
import { encodeBranchPath } from './encode-branch-path'
import { githubFetch, type GithubContext } from './github-fetch'

export async function getHeadCommit(
  context: GithubContext,
  branch: string,
): Promise<{ commitSha: string; treeSha: string }> {
  const refResponse = await githubFetch(
    context,
    `/git/ref/heads/${encodeBranchPath(branch)}`,
  )
  if (!refResponse.ok)
    throw new Error(`ref lookup failed: ${refResponse.status}`)
  const ref = (await refResponse.json()) as { object: { sha: string } }

  const commitResponse = await githubFetch(
    context,
    `/git/commits/${ref.object.sha}`,
  )
  if (!commitResponse.ok)
    throw new Error(`commit lookup failed: ${commitResponse.status}`)
  const commit = (await commitResponse.json()) as {
    sha: string
    tree: { sha: string }
  }

  return { commitSha: commit.sha, treeSha: commit.tree.sha }
}
```

`src/background/create-blob.ts`:

```ts
import { githubFetch, type GithubContext } from './github-fetch'

export async function createBlob(
  context: GithubContext,
  content: string,
): Promise<string> {
  const response = await githubFetch(context, '/git/blobs', {
    method: 'POST',
    body: JSON.stringify({ content, encoding: 'utf-8' }),
  })
  if (!response.ok) throw new Error(`blob creation failed: ${response.status}`)
  return ((await response.json()) as { sha: string }).sha
}
```

`src/background/create-tree.ts`:

```ts
import { githubFetch, type GithubContext } from './github-fetch'

export async function createTree(
  context: GithubContext,
  baseTreeSha: string,
  entries: Array<{ path: string; sha: string }>,
): Promise<string> {
  const response = await githubFetch(context, '/git/trees', {
    method: 'POST',
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: entries.map((entry) => ({
        path: entry.path,
        mode: '100644',
        type: 'blob',
        sha: entry.sha,
      })),
    }),
  })
  if (!response.ok) throw new Error(`tree creation failed: ${response.status}`)
  return ((await response.json()) as { sha: string }).sha
}
```

`src/background/create-commit.ts`:

```ts
import { githubFetch, type GithubContext } from './github-fetch'

export async function createCommit(
  context: GithubContext,
  input: { message: string; treeSha: string; parentSha: string },
): Promise<string> {
  const response = await githubFetch(context, '/git/commits', {
    method: 'POST',
    body: JSON.stringify({
      message: input.message,
      tree: input.treeSha,
      parents: [input.parentSha],
    }),
  })
  if (!response.ok)
    throw new Error(`commit creation failed: ${response.status}`)
  return ((await response.json()) as { sha: string }).sha
}
```

`src/background/not-fast-forward-error.ts`:

```ts
export class NotFastForwardError extends Error {
  constructor() {
    super('ref update was not a fast forward')
    this.name = 'NotFastForwardError'
  }
}
```

`src/background/update-ref.ts`:

```ts
import { encodeBranchPath } from './encode-branch-path'
import { githubFetch, type GithubContext } from './github-fetch'
import { NotFastForwardError } from './not-fast-forward-error'

export async function updateRef(
  context: GithubContext,
  branch: string,
  commitSha: string,
): Promise<void> {
  const response = await githubFetch(
    context,
    `/git/refs/heads/${encodeBranchPath(branch)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ sha: commitSha, force: false }),
    },
  )
  if (response.ok) return
  if (response.status === 409 || response.status === 422)
    throw new NotFastForwardError()
  throw new Error(`ref update failed: ${response.status}`)
}
```

GitHub answers a non-fast-forward `PATCH /git/refs` with 422 and a "not a fast
forward" message; 409 shows up in other conflict situations. Both mean the same
thing here: another machine moved the branch.

`src/background/check-existing-clip.ts`:

```ts
import { githubFetch, type GithubContext } from './github-fetch'

export type ExistingClipStatus = 'absent' | 'identical' | 'conflict'

export async function checkExistingClip(
  context: GithubContext,
  input: {
    branch: string
    dirPath: string
    clipId: string
    contentSha256: string
  },
): Promise<ExistingClipStatus> {
  const response = await githubFetch(
    context,
    `/contents/${input.dirPath}/metadata.json?ref=${encodeURIComponent(input.branch)}`,
    { headers: { accept: 'application/vnd.github.raw+json' } },
  )
  if (response.status === 404) return 'absent'
  if (!response.ok)
    throw new Error(`existing clip lookup failed: ${response.status}`)

  const existing = (await response.json()) as {
    clip_id?: string
    content_sha256?: string
  }
  const identical =
    existing.clip_id === input.clipId &&
    existing.content_sha256 === input.contentSha256
  return identical ? 'identical' : 'conflict'
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test && pnpm typecheck` Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/background tests/background
git commit -m "Add GitHub Git Data API primitives and existing-clip detection"
```

---

### Task 7: Atomic commit orchestration with rebuild on conflict

**Files:**

- Create: `src/background/commit-clip.ts`
- Create: `src/background/clip-conflict-error.ts`
- Test: `tests/background/commit-clip.test.ts`

**Interfaces:**

- Consumes: everything from Task 6, `ClipFiles` (Task 4).
- Produces:
  - `ClipConflictError`
  - `commitClip(context: GithubContext, input: { branch: string; clip: ClipFiles }): Promise<{ commitSha: string | null; alreadyPresent: boolean }>` -
    `commitSha` is null exactly when `alreadyPresent` is true, so "no commit
    happened" is a type-level fact rather than a convention

- [ ] **Step 1: Write the failing tests**

`tests/background/commit-clip.test.ts`:

```ts
import { commitClip } from '../../src/background/commit-clip'
import { ClipConflictError } from '../../src/background/clip-conflict-error'
import { NotFastForwardError } from '../../src/background/not-fast-forward-error'

const context = { token: 't', owner: 'o', repo: 'r' }

const clip = {
  dirPath: 'clips/pending/2026/07/x',
  metadata: { clip_id: 'ID1', content_sha256: 'a'.repeat(64), title: 'Title' },
  files: {
    'clips/pending/2026/07/x/index.md': '# a',
    'clips/pending/2026/07/x/source.html': '<p>a</p>',
    'clips/pending/2026/07/x/metadata.json': '{}',
    'clips/pending/2026/07/x/state.json': '{}',
  },
} as unknown as Parameters<typeof commitClip>[1]['clip']

interface Call {
  url: string
  body: unknown
}

function harness(options: {
  failFirstRefUpdate: boolean
  failEveryRefUpdate?: boolean
  existing?: unknown
}) {
  const calls: Call[] = []
  let refUpdates = 0
  let head = 'commitA'

  globalThis.fetch = vi.fn(
    async (url: string | URL | Request, init?: RequestInit) => {
      const href = String(url)
      const body = init?.body ? JSON.parse(String(init.body)) : undefined
      calls.push({ url: href, body })

      if (href.includes('/contents/')) {
        return options.existing === undefined
          ? new Response('{"message":"Not Found"}', { status: 404 })
          : new Response(JSON.stringify(options.existing), { status: 200 })
      }
      if (href.includes('/git/ref/heads/'))
        return new Response(JSON.stringify({ object: { sha: head } }), {
          status: 200,
        })
      if (href.includes('/git/commits/'))
        return new Response(
          JSON.stringify({ sha: head, tree: { sha: `tree-${head}` } }),
          { status: 200 },
        )
      if (href.endsWith('/git/blobs'))
        return new Response(JSON.stringify({ sha: `blob-${calls.length}` }), {
          status: 200,
        })
      if (href.endsWith('/git/trees'))
        return new Response(JSON.stringify({ sha: `tree-new-${head}` }), {
          status: 200,
        })
      if (href.endsWith('/git/commits'))
        return new Response(JSON.stringify({ sha: `commit-new-${head}` }), {
          status: 200,
        })
      if (href.includes('/git/refs/heads/')) {
        refUpdates += 1
        if (options.failEveryRefUpdate) {
          head = `commit-${refUpdates}`
          return new Response('{"message":"Update is not a fast forward"}', {
            status: 422,
          })
        }
        if (options.failFirstRefUpdate && refUpdates === 1) {
          head = 'commitB'
          return new Response('{"message":"Update is not a fast forward"}', {
            status: 422,
          })
        }
        return new Response('{}', { status: 200 })
      }
      throw new Error(`unexpected ${href}`)
    },
  ) as unknown as typeof fetch

  return { calls, refUpdateCount: () => refUpdates }
}

test('creates four blobs and one commit on the happy path', async () => {
  const h = harness({ failFirstRefUpdate: false })
  const result = await commitClip(context, { branch: 'main', clip })

  expect(result.alreadyPresent).toBe(false)
  expect(
    h.calls.filter((call) => call.url.endsWith('/git/blobs')),
  ).toHaveLength(4)
  expect(
    h.calls.filter((call) => call.url.endsWith('/git/commits')),
  ).toHaveLength(1)
  expect(h.refUpdateCount()).toBe(1)
})

test('rebuilds tree and commit against the new head after a non-fast-forward', async () => {
  const h = harness({ failFirstRefUpdate: true })
  await commitClip(context, { branch: 'main', clip })

  const commitBodies = h.calls.filter(
    (call) => call.url.endsWith('/git/commits') && call.body,
  )
  expect(commitBodies).toHaveLength(2)
  expect((commitBodies[0]?.body as { parents: string[] }).parents).toEqual([
    'commitA',
  ])
  expect((commitBodies[1]?.body as { parents: string[] }).parents).toEqual([
    'commitB',
  ])

  const treeBodies = h.calls.filter((call) => call.url.endsWith('/git/trees'))
  expect((treeBodies[1]?.body as { base_tree: string }).base_tree).toBe(
    'tree-commitB',
  )
})

test('does not re-upload blobs on retry', async () => {
  const h = harness({ failFirstRefUpdate: true })
  await commitClip(context, { branch: 'main', clip })
  expect(
    h.calls.filter((call) => call.url.endsWith('/git/blobs')),
  ).toHaveLength(4)
})

test('an identical existing clip is a no-op', async () => {
  const h = harness({
    failFirstRefUpdate: false,
    existing: { clip_id: 'ID1', content_sha256: 'a'.repeat(64) },
  })
  const result = await commitClip(context, { branch: 'main', clip })

  expect(result.alreadyPresent).toBe(true)
  expect(
    h.calls.filter((call) => call.url.endsWith('/git/blobs')),
  ).toHaveLength(0)
})

test('gives up after three conflicting attempts', async () => {
  const h = harness({ failFirstRefUpdate: false, failEveryRefUpdate: true })
  await expect(
    commitClip(context, { branch: 'main', clip }),
  ).rejects.toBeInstanceOf(NotFastForwardError)
  expect(h.refUpdateCount()).toBe(3)
})

test('a non-conflict failure propagates on the first attempt', async () => {
  let refUpdates = 0
  globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
    const href = String(url)
    if (href.includes('/contents/'))
      return new Response('{"message":"Not Found"}', { status: 404 })
    if (href.includes('/git/ref/heads/'))
      return new Response('{"object":{"sha":"c1"}}', { status: 200 })
    if (href.includes('/git/commits/'))
      return new Response('{"sha":"c1","tree":{"sha":"t1"}}', { status: 200 })
    if (href.endsWith('/git/blobs'))
      return new Response('{"sha":"b1"}', { status: 200 })
    if (href.endsWith('/git/trees'))
      return new Response('{"sha":"t2"}', { status: 200 })
    if (href.endsWith('/git/commits'))
      return new Response('{"sha":"c2"}', { status: 200 })
    if (href.includes('/git/refs/heads/')) {
      refUpdates += 1
      return new Response('{"message":"Bad credentials"}', { status: 401 })
    }
    throw new Error(`unexpected ${href}`)
  }) as unknown as typeof fetch

  await expect(commitClip(context, { branch: 'main', clip })).rejects.toThrow(
    /401/,
  )
  expect(refUpdates).toBe(1)
})

test('a different clip at the same path is a hard failure', async () => {
  harness({
    failFirstRefUpdate: false,
    existing: { clip_id: 'OTHER', content_sha256: 'b'.repeat(64) },
  })
  await expect(
    commitClip(context, { branch: 'main', clip }),
  ).rejects.toBeInstanceOf(ClipConflictError)
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test` Expected: FAIL - missing modules.

- [ ] **Step 3: Implement the orchestration**

`src/background/clip-conflict-error.ts`:

```ts
export class ClipConflictError extends Error {
  constructor(dirPath: string) {
    super(`a different clip already exists at ${dirPath}`)
    this.name = 'ClipConflictError'
  }
}
```

`src/background/commit-clip.ts`:

```ts
import type { ClipFiles } from '../shared/build-clip-files'
import { checkExistingClip } from './check-existing-clip'
import { ClipConflictError } from './clip-conflict-error'
import { createBlob } from './create-blob'
import { createCommit } from './create-commit'
import { createTree } from './create-tree'
import { getHeadCommit } from './get-head-commit'
import type { GithubContext } from './github-fetch'
import { NotFastForwardError } from './not-fast-forward-error'
import { updateRef } from './update-ref'

const MAX_ATTEMPTS = 3

export async function commitClip(
  context: GithubContext,
  input: { branch: string; clip: ClipFiles },
): Promise<{ commitSha: string | null; alreadyPresent: boolean }> {
  const existing = await checkExistingClip(context, {
    branch: input.branch,
    dirPath: input.clip.dirPath,
    clipId: input.clip.metadata.clip_id,
    contentSha256: input.clip.metadata.content_sha256,
  })
  if (existing === 'identical') return { commitSha: null, alreadyPresent: true }
  if (existing === 'conflict') throw new ClipConflictError(input.clip.dirPath)

  const entries = await Promise.all(
    Object.entries(input.clip.files).map(async ([path, content]) => ({
      path,
      sha: await createBlob(context, content),
    })),
  )

  const message = `Clip: ${input.clip.metadata.title}`

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const head = await getHeadCommit(context, input.branch)
    const treeSha = await createTree(context, head.treeSha, entries)
    const commitSha = await createCommit(context, {
      message,
      treeSha,
      parentSha: head.commitSha,
    })
    try {
      await updateRef(context, input.branch, commitSha)
      return { commitSha, alreadyPresent: false }
    } catch (error) {
      if (!(error instanceof NotFastForwardError) || attempt === MAX_ATTEMPTS)
        throw error
    }
  }

  // Every loop iteration returns or throws; this only satisfies TypeScript's
  // control-flow analysis, which cannot prove the loop is exhaustive.
  throw new Error('unreachable')
}
```

The retry re-reads HEAD and rebuilds both the tree and the commit; re-pushing
the same commit object would fail forever. Blobs are content-addressed, so they
are uploaded once and reused across attempts.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test && pnpm typecheck` Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/background tests/background
git commit -m "Commit clips atomically, rebuilding on non-fast-forward"
```

---

### Task 8: Wire it together - injection, service worker, badge

**Files:**

- Create: `src/content/capture-page.ts`
- Create: `src/content/send-to-background.ts`
- Create: `src/background/badges.ts`
- Create: `src/background/set-badge.ts`
- Create: `src/background/report-failure.ts`
- Create: `src/background/harden-token-storage-safely.ts`
- Create: `src/background/begin-capture.ts`
- Create: `src/background/capture-failed-payload.ts`
- Create: `src/background/start-capture.ts`
- Create: `src/background/handle-captured-page.ts`
- Modify: `src/background/service-worker.ts`
- Test: `tests/background/handle-captured-page.test.ts`

**Interfaces:**

- Consumes: Tasks 3-7.
- Produces:
  - `CapturedPagePayload = { type: 'clip-captured'; url: string; markdown: string; sourceHtml: string; snapshotMode: 'extracted' | 'sanitized'; extractor: Extractor; page: PageMetadata }`
  - `setBadge(state: 'working' | 'ok' | 'error'): Promise<void>`
  - `startCapture(tabId: number): Promise<void>`
  - `handleCapturedPage(payload: CapturedPagePayload): Promise<void>`

- [ ] **Step 1: Write the content entry script**

`src/content/capture-page.ts`:

```ts
import { byteLength } from '../shared/byte-length'
import { LIMITS } from '../shared/limits'
import { collectPageMetadata } from './collect-page-metadata'
import { extractContent } from './extract-content'
import { getSelectionHtml } from './get-selection-html'
import { sanitizeHtml } from './sanitize-html'
import { toMarkdown } from './to-markdown'

function capture(): void {
  const selectionHtml = getSelectionHtml(window)
  const extracted = extractContent(document, selectionHtml)
  const cleanExtracted = sanitizeHtml(extracted.html)

  const wholePage = sanitizeHtml(document.documentElement.outerHTML)
  const fitsWholePage = byteLength(wholePage) <= LIMITS.MAX_SOURCE_HTML_BYTES

  void sendToBackground({
    type: 'clip-captured',
    url: location.href,
    markdown: toMarkdown(cleanExtracted),
    sourceHtml: fitsWholePage ? wholePage : cleanExtracted,
    snapshotMode: fitsWholePage ? 'sanitized' : 'extracted',
    extractor: extracted.extractor,
    page: collectPageMetadata(document, location.href),
  })
}

try {
  capture()
} catch (error) {
  void sendToBackground({
    type: 'clip-failed',
    reason: error instanceof Error ? error.message : String(error),
  })
}
```

`src/content/send-to-background.ts` - `sendMessage` rejects when there is no
receiving end, which happens for real whenever the service worker is mid-restart
or the extension was just reloaded. A content script cannot touch the badge, so
the honest ceiling here is a log in the page's console; that is strictly better
than an uncaught rejection nobody ever sees:

```ts
export async function sendToBackground(message: unknown): Promise<void> {
  try {
    await chrome.runtime.sendMessage(message)
  } catch (error) {
    console.error(
      'brain clipper: could not reach the extension background',
      error,
    )
  }
}
```

The guard is not decoration: without it, a page that breaks extraction produces
no message at all, so the service worker never even sets the working badge and
the click looks like it did nothing.

The snapshot rule is deterministic: the sanitized whole page when it fits the
cap, otherwise the sanitized extracted article, and `snapshot_mode` records
which one landed.

- [ ] **Step 2: Write the failing test for the background handler**

`tests/background/handle-captured-page.test.ts`:

```ts
import { installChromeMock } from '../chrome-mock'
import { handleCapturedPage } from '../../src/background/handle-captured-page'

const payload = {
  type: 'clip-captured' as const,
  url: 'https://example.com/a',
  markdown: '# Title\n\nBody',
  sourceHtml: '<p>Body</p>',
  snapshotMode: 'sanitized' as const,
  extractor: 'readability' as const,
  page: {
    title: 'Title',
    author: null,
    published: null,
    canonicalUrl: null,
    language: 'en',
    site: 'example.com',
  },
}

function mockGithub(): { paths: string[] } {
  const paths: string[] = []
  globalThis.fetch = vi.fn(
    async (url: string | URL | Request, init?: RequestInit) => {
      const href = String(url)
      if (href.includes('/contents/'))
        return new Response('{"message":"Not Found"}', { status: 404 })
      if (href.includes('/git/ref/heads/'))
        return new Response('{"object":{"sha":"c1"}}', { status: 200 })
      if (href.includes('/git/commits/'))
        return new Response('{"sha":"c1","tree":{"sha":"t1"}}', { status: 200 })
      if (href.endsWith('/git/blobs'))
        return new Response('{"sha":"b1"}', { status: 200 })
      if (href.endsWith('/git/trees')) {
        const body = JSON.parse(String(init?.body)) as {
          tree: Array<{ path: string }>
        }
        paths.push(...body.tree.map((entry) => entry.path))
        return new Response('{"sha":"t2"}', { status: 200 })
      }
      if (href.endsWith('/git/commits'))
        return new Response('{"sha":"c2"}', { status: 200 })
      if (href.includes('/git/refs/heads/'))
        return new Response('{}', { status: 200 })
      throw new Error(`unexpected ${href}`)
    },
  ) as unknown as typeof fetch
  return { paths }
}

test('a captured page becomes one commit of four files', async () => {
  const stores = installChromeMock()
  Object.assign(stores.sync.data, {
    owner: 'o',
    repo: 'r',
    branch: 'main',
    machineName: 'mac-cristian',
  })
  stores.local.data.githubToken = 'tok'
  const github = mockGithub()

  await handleCapturedPage(payload)

  expect(github.paths).toHaveLength(4)
  expect(github.paths.every((path) => path.startsWith('clips/pending/'))).toBe(
    true,
  )
})

test('refuses to clip when the token is missing, before writing anything', async () => {
  const stores = installChromeMock()
  Object.assign(stores.sync.data, {
    owner: 'o',
    repo: 'r',
    branch: 'main',
    machineName: 'm',
  })
  const github = mockGithub()

  await expect(handleCapturedPage(payload)).rejects.toThrow(/token/i)
  expect(github.paths).toHaveLength(0)
})
```

Extend `tests/chrome-mock.ts` with the action API used by the badge:

```ts
;(globalThis as unknown as { chrome: Record<string, unknown> }).chrome = {
  storage: { sync: area(sync), local: area(local) },
  action: {
    setBadgeText: async () => {},
    setBadgeBackgroundColor: async () => {},
  },
  runtime: { getManifest: () => ({ version: '0.1.0' }) },
}
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm test tests/background/handle-captured-page.test.ts` Expected: FAIL -
missing module.

- [ ] **Step 4: Implement the background side**

`src/background/set-badge.ts`:

```ts
const BADGES = {
  working: { text: '...', color: '#888888' },
  ok: { text: 'ok', color: '#2e7d32' },
  error: { text: '!', color: '#c62828' },
} as const

export async function setBadge(state: keyof typeof BADGES): Promise<void> {
  const badge = BADGES[state]
  await chrome.action.setBadgeBackgroundColor({ color: badge.color })
  await chrome.action.setBadgeText({ text: badge.text })
  if (state !== 'working') {
    setTimeout(() => void chrome.action.setBadgeText({ text: '' }), 4000)
  }
}
```

`src/background/report-failure.ts` - every failure has to become something the
user can see, because a badge that never changes is indistinguishable from a
broken click:

```ts
import { setBadge } from './set-badge'

export function reportFailure(context: string, error: unknown): void {
  console.error(`brain clipper: ${context}`, error)
  void setBadge('error').catch((badgeError) => {
    console.error('brain clipper: could not set the error badge', badgeError)
  })
}
```

The log comes first on purpose: it is synchronous, so it survives even when the
badge call is what failed.

`src/background/harden-token-storage-safely.ts`:

```ts
import { hardenTokenStorage } from '../shared/harden-token-storage'
import { reportFailure } from './report-failure'

export async function hardenTokenStorageSafely(): Promise<void> {
  try {
    await hardenTokenStorage()
  } catch (error) {
    reportFailure('could not restrict token storage to trusted contexts', error)
  }
}
```

`src/background/begin-capture.ts` - `executeScript` rejects on a restricted page
(`chrome://`, the Web Store, the PDF viewer), and `activeTab` is the only
permission backing injection, so this is a routine outcome rather than an
exceptional one:

```ts
import { reportFailure } from './report-failure'
import { startCapture } from './start-capture'

export function beginCapture(tabId: number): void {
  void startCapture(tabId).catch((error) =>
    reportFailure('could not inject the capture script', error),
  )
}
```

`src/background/capture-failed-payload.ts`:

```ts
export interface CaptureFailedPayload {
  type: 'clip-failed'
  reason: string
}
```

`src/background/handle-captured-page.ts`:

```ts
import type { Extractor } from '../content/extract-content'
import type { PageMetadata } from '../content/collect-page-metadata'
import { buildClipFiles } from '../shared/build-clip-files'
import { getSettings } from '../shared/get-settings'
import { getToken } from '../shared/get-token'
import { newClipId } from '../shared/new-clip-id'
import { commitClip } from './commit-clip'

export interface CapturedPagePayload {
  type: 'clip-captured'
  url: string
  markdown: string
  sourceHtml: string
  snapshotMode: 'extracted' | 'sanitized'
  extractor: Extractor
  page: PageMetadata
}

export async function handleCapturedPage(
  payload: CapturedPagePayload,
): Promise<void> {
  const settings = await getSettings()
  if (!settings)
    throw new Error('settings are incomplete - open the options page')
  const token = await getToken()
  if (!token)
    throw new Error('no GitHub token on this device - open the options page')

  const clip = await buildClipFiles({
    clipId: newClipId(),
    url: payload.url,
    markdown: payload.markdown,
    sourceHtml: payload.sourceHtml,
    snapshotMode: payload.snapshotMode,
    extractor: payload.extractor,
    page: payload.page,
    clippedAt: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
    clippedFrom: settings.machineName,
    extensionVersion: chrome.runtime.getManifest().version,
  })

  await commitClip(
    { token, owner: settings.owner, repo: settings.repo },
    { branch: settings.branch, clip },
  )
}
```

`src/background/start-capture.ts`:

```ts
const inFlight = new Set<number>()

export async function startCapture(tabId: number): Promise<void> {
  if (inFlight.has(tabId)) return
  inFlight.add(tabId)
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content/capture-page.js'],
    })
  } finally {
    setTimeout(() => inFlight.delete(tabId), 5000)
  }
}
```

The guard is in-memory on purpose, and its window is the 5 seconds of the
timeout: it stops a double click, not a deliberate re-clip. Cross-restart
protection is the durable queue in Phase 2 and is explicitly out of scope here.

Worth being precise about what the path-exists rule does and does not buy,
because the clip id is regenerated on every capture: two clips of the same page
land in two directories and neither `identical` nor `conflict` is reached. Those
branches matter within a single `commitClip` call - and, in Phase 2, when a
resumed job reuses its `clip_id`. The rule is an integrity guard, not
deduplication.

`src/background/service-worker.ts` (replaces the placeholder):

```ts
import { beginCapture } from './begin-capture'
import type { CaptureFailedPayload } from './capture-failed-payload'
import {
  handleCapturedPage,
  type CapturedPagePayload,
} from './handle-captured-page'
import { hardenTokenStorageSafely } from './harden-token-storage-safely'
import { reportFailure } from './report-failure'
import { setBadge } from './set-badge'

chrome.runtime.onInstalled.addListener(() => void hardenTokenStorageSafely())
chrome.runtime.onStartup.addListener(() => void hardenTokenStorageSafely())

chrome.action.onClicked.addListener((tab) => {
  if (tab.id !== undefined) beginCapture(tab.id)
})

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === 'clip-page' && tab?.id !== undefined) beginCapture(tab.id)
})

chrome.runtime.onMessage.addListener(
  (message: CapturedPagePayload | CaptureFailedPayload) => {
    if (message.type === 'clip-failed') {
      reportFailure('capture failed in the page', message.reason)
      return
    }
    if (message.type !== 'clip-captured') return
    void (async () => {
      await setBadge('working')
      try {
        await handleCapturedPage(message)
        await setBadge('ok')
      } catch (error) {
        reportFailure('clip failed', error)
      }
    })()
  },
)
```

Nothing here is left as a bare `void promise`: an unhandled rejection in a
service worker is invisible, and every one of these paths is a case the user is
entitled to see.

- [ ] **Step 5: Extend the build with the content entry point**

Append to `build.mjs`, alongside the options bundle:

```js
await build({
  entryPoints: ['src/content/capture-page.ts'],
  outdir: 'dist',
  outbase: 'src',
  bundle: true,
  format: 'iife',
  target: 'chrome120',
})
```

- [ ] **Step 6: Run the tests and build**

Run: `pnpm test && pnpm typecheck && pnpm build` Expected: PASS;
`dist/content/capture-page.js` exists (the path the injection references).

- [ ] **Step 7: Commit**

```bash
git add src tests
git commit -m "Wire capture: injection, message handling, commit, badge feedback"
```

---

### Task 9: End-to-end verification and README

**Files:**

- Modify: `README.md`
- Test: manual, against real Chromium and the real repo

**Interfaces:**

- Consumes: everything.
- Produces: a verified Phase 1 and setup documentation.

- [ ] **Step 1: Create the fine-grained token**

On GitHub: Settings -> Developer settings -> Personal access tokens ->
Fine-grained tokens. Repository access: only `BusiRocket/brain-clips`.
Permissions: `Contents: Read and write`. Expiry: 90 days.

Record the token and its expiry in `~/p/vault`. Do not paste it into any commit.

- [ ] **Step 2: Configure the extension**

```bash
cd ~/p/brain-clipper && pnpm build
```

Reload the unpacked extension, open its options page, fill in `BusiRocket` /
`brain-clips` / `main` / a machine name, paste the token, Save.

- [ ] **Step 3: Run the acceptance checklist**

Each line is a pass/fail gate. Phase 1 is not done until all of them pass.

- [ ] Selecting a paragraph and clicking the icon commits **only** the selection
      (`extractor: selection`).
- [ ] Clicking with no selection on a normal article uses Readability
      (`extractor: readability`).
- [ ] The markdown of that article contains no navigation, no footer, no cookie
      banner.
- [ ] A page whose title contains `:` and `"` produces valid YAML (`git show`
      the file, parse it).
- [ ] Clipping the same page content twice produces the same `content_sha256`
      despite a different `clipped_at`.
- [ ] One click produces exactly one commit (`git log --oneline -1` on a fresh
      pull).
- [ ] That commit contains exactly four files under
      `clips/pending/YYYY/MM/<dir>/`.
- [ ] The token is unreachable from a content script: on any page, run in the
      page's devtools console `chrome?.storage?.local?.get?.(['githubToken'])`
      and confirm it is unavailable or empty.
- [ ] `chrome://extensions` shows no host access beyond `api.github.com` - the
      extension does not read all sites.
- [ ] Killing the network mid-clip leaves **no** partial clip in the repo
      (verify with `git log`), and the badge shows the error state.
- [ ] Re-running a clip whose path exists with different content fails loudly
      with `ClipConflictError` instead of overwriting.
- [ ] `pnpm build` from a clean clone plus "Load unpacked" works with no manual
      steps beyond the options page.
- [ ] The clip renders correctly on github.com (headings, links, lists, tables).
- [ ] `Cmd+Shift+S` produces the same result as the toolbar click.

- [ ] **Step 4: Write the README**

`README.md` must cover: what the extension does, install (clone, `pnpm install`,
`pnpm build`, load unpacked), the token setup from Step 1, the settings fields,
the clip layout on disk, and an explicit "not yet implemented" list matching the
out-of-scope section of this plan.

- [ ] **Step 5: Commit and push**

```bash
git add README.md
git commit -m "Document install, token setup and Phase 1 scope"
git push
```

---

## Phase 1 exit criteria

Phase 1 is complete when every box in Task 9 Step 3 is ticked, `pnpm test` and
`pnpm typecheck` are green, and at least three real pages of different shapes
(article, documentation page, SPA) have been clipped and reviewed in
`BusiRocket/brain-clips`.

Phase 2 (durable queue, alarms, leases, retries) starts only after that.

---

## Post-review corrections (final whole-branch review, 2026-07-26)

The whole-branch review found defects that per-task reviews structurally could
not: they only appear when all nine modules compose. Each item below amends the
task text above; where they conflict, this section wins.

### 1. A relative `rel="canonical"` must not kill the capture (was Critical)

`collect-page-metadata.ts` read the attribute verbatim, so `href="/agents"`
failed `z.string().url()` and `ClipMetadataSchema.parse` threw, discarding the
whole clip. Relative canonical links are common and page-controlled. Resolve
against the page URL and degrade to null rather than throwing:

```ts
function readCanonicalUrl(doc: Document, url: string): string | null {
  const href = doc.querySelector('link[rel="canonical"]')?.getAttribute('href')
  if (!href) return null
  try {
    return new URL(href, url).toString()
  } catch {
    return null
  }
}
```

That lives in its own file, `src/content/read-canonical-url.ts`.

### 2. Relative links and images must be absolutized on every extractor path

Readability absolutizes URIs internally; the `selection`, `article`, `main` and
`body` branches read `innerHTML` from the live DOM and keep hrefs as authored. A
relative link in the clips repo renders on github.com as a live link to the
wrong place, which is worse than a broken one. `src/content/resolve-urls.ts`
rewrites `href`, `src` and `srcset` against `document.baseURI` before Turndown,
applied to every non-Readability branch.

### 3. An oversized snapshot must not discard the markdown

`buildClipFiles` threw when `source.html` exceeded `MAX_SOURCE_HTML_BYTES`,
taking the markdown — the actual payload — with it. The per-file cap exists for
git blob hygiene, not correctness. When the snapshot does not fit, drop it and
record that in the metadata (`snapshot_mode: 'omitted'`, added to the schema's
enum) instead of failing.

### 4. Failures must be distinguishable without opening devtools

Every failure produced the same four-second red badge, with the reason only in
the service-worker console. The design's own failure table promised the no-token
case opens the options page. `reportFailure` now also sets the action title to
the reason (`chrome.action.setTitle`), so a hover explains it, and a settings or
token failure calls `chrome.runtime.openOptionsPage()`.

### 5. The domain denylist was dropped without being declared out of scope

The design specifies a denylist blocking capture on banking, mail, admin panels
and `localhost`, and it never appeared in the out-of-scope list. Without it, one
click on a logged-in page commits its body to git permanently, labelled
`sensitivity: public` - the field phase 4's routing keys on to decide whether a
model may read it.

`src/shared/denylisted-hostnames.ts` holds a conservative starting list; the
predicate lives in `src/shared/is-denylisted-hostname.ts` and also refuses
loopback, `.local` and private-IP literals. `handleCapturedPage` refuses a
denylisted host before building anything, and the refusal reaches the badge and
the action title. The list is a starting point the user is expected to extend,
and that expectation is documented in the README.

`sensitivity` stays hardcoded `public` in phase 1 - which is now honest, because
anything the denylist would call private is refused outright rather than
committed with a wrong label.

### 6. One home for the token storage key

`'githubToken'` was a bare literal in three files, so renaming it in one place
would turn `clearToken()` into a silent no-op while the options page still
reported success. `src/shared/token-key.ts` exports it; all three accessors
import it.

### 7. The capture payload logic gets its own tested module

`capture-page.ts` held the only untested decision logic in the codebase and the
last module-private helper. `src/content/build-captured-payload.ts` exports
`buildCapturedPayload(doc: Document, win: Window, url: string): CapturedPagePayload`,
tested under jsdom; the entry file becomes a call plus the try/catch.

### 8. `source.html` is the sanitized body, not the document

DOMPurify's default `WHOLE_DOCUMENT: false` drops `<html>`, `<head>`, `<title>`
and `lang`, so what lands is the sanitized body. The design's "the exact HTML
handed to the extractor" was wrong about this. Document the reality rather than
changing the behaviour: `snapshot_mode: 'sanitized'` means the sanitized body of
the page.

### 9. Assertions that cannot fail

`expect(['body', 'innertext']).toContain(result.extractor)` cannot fail when the
chain's ordering changes, and the ledger records that this exact looseness let
the body-wins-for-bare-text bug survive a review round. Pin it to `'body'`.

The acceptance checklist's token check has the same flaw and is worse, because
it reads as a pass: `chrome.storage` is never exposed to page JS regardless of
`accessLevel`, so running `chrome.storage.local.get(['githubToken'])` in the
page console returns "unavailable" whether hardening worked or not. To actually
verify `TRUSTED_CONTEXTS`, run it in the content script's isolated world using
the devtools console context selector.

### 10. Smaller corrections folded into the same pass

- The `innertext` branch interpolated `textContent` into `<p>...</p>`, so page
  text was reinterpreted as markup. Build the element and set `textContent`.
- `extractor_version` reported Readability's version for every extractor,
  including `selection`; report the version only for `readability` and null
  otherwise, and read it from the package rather than a hardcoded string.
- `normalizeUrl` preserved `user:password@` userinfo straight into git. Strip
  it.
- An empty title produced the commit message `Clip: ` and a title-less
  directory. Fall back to the hostname.
- `@types/js-yaml@4` is inert (js-yaml 5 ships its own types) and describes the
  old `quotingType` option, a landmine on the frontmatter path. Remove it.
- The message listener trusted the payload shape; guard it before reading
  `.type`.

### Deliberately still deferred

- No MV3 keepalive around the commit sequence: `fetch` does not reset the
  30-second idle timer, so a slow connection can lose a clip and leave the badge
  stuck on `...`. No partial clip can result - the ref update is the only
  mutation. Phase 2's durable queue is the real fix; until then a stuck `...`
  means "worker died, clip lost", not "hung".
- No transliteration for non-ASCII titles, so a CJK or Cyrillic title slugifies
  to nothing and the directory carries only date, host and id.
- No per-tab badge; two captures within four seconds can clear each other's
  result.
- No backoff on the four concurrent blob POSTs, which is the burst pattern
  GitHub's secondary rate limits watch for.
- HTTP status lives only inside error message strings. Phase 2 needs a
  `GithubRequestError` carrying status and headers to separate permanent from
  transient.
- `newClipId()` and `clippedAt` are minted inside `handleCapturedPage`. Phase 2
  must move both to the enqueue boundary, because a resumed job has to reuse
  them or it lands in a different directory and the `identical`/`conflict` rule
  never fires. This is the first thing phase 2 should change.

---

## Post-phase amendment: auth replaced (2026-07-27)

Task 5 ("Settings and token storage, options page") is superseded on two points.
The design doc's Auth section is the authoritative version; this note records
what changed so the task text above is not read as current.

1. **A pasted fine-grained PAT becomes a GitHub App device-flow sign-in.** The
   PAT was never created, so nothing had to migrate. The authorization-code flow
   was not an option: GitHub requires `client_secret` to exchange the code and
   supports no PKCE for it, so a client-only extension would have needed a
   backend holding one secret. The device flow needs no secret, and GitHub
   waives `client_secret` when refreshing a token the device flow issued, so
   rotation stays secretless too. Device flow must be enabled explicitly on the
   app, and `https://github.com/*` joins the host permissions because its
   endpoints are on the web host, not the API host. The poll runs in the options
   page, not the service worker, which Chrome may terminate between polls.

2. **`machineName` leaves `chrome.storage.sync`.** Task 5 synced all four
   settings fields; that gave every device on the same Chrome profile the same
   `clipped_from`, which is exactly what the field exists to distinguish. It now
   lives in `chrome.storage.local` alongside the credential, and `setSettings`
   deletes the stale synced copy. An extension cannot read the host's real name,
   so the options page prefills an editable `os-arch-<random>` default.

Storage shape: `githubToken` (a bare string) becomes `githubCredential`
`{ accessToken, refreshToken, expiresAt, login }`, still local-only and still
behind `TRUSTED_CONTEXTS`. `getAccessToken()` renews two minutes before expiry
and persists the renewal; a refresh that cannot succeed raises an error carrying
the `open the options page` marker, so the existing failure wiring opens it.
