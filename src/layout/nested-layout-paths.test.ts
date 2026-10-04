import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { codexPrompt } from '../codex/codex-prompt.ts'
import { withSyntopicaConfig } from '../config/with-syntopica-config.ts'
import { triageRootPath } from '../harvest/triage/triage-root-path.ts'
import { worktreeEngineOverlay } from '../index-map/worktree-engine-overlay.ts'
import { ledgerRelativePath } from '../ledger/ledger-relative-path.ts'
import { diffNeedsHuman } from '../review/diff-needs-human.ts'
import { sensitiveDiffRefusal } from '../review/sensitive-diff-refusal.ts'
import { sensitiveDomainsPath } from '../routing/sensitive-domains-path.ts'
import { nestedWikiConfig } from '../testing/nested-wiki-config.ts'
import { indexRepositoryPath } from './index-repository-path.ts'
import { isConfiguredPagePath } from './is-configured-page-path.ts'
import { wikiPagePath } from './wiki-page-path.ts'

const CLIP = '01M3QXGJFSCX7CNRVP8YBZSTPN'

describe('a wiki nested under brain/', () => {
  const { data, config } = nestedWikiConfig()
  const nested = <T>(body: () => T): T => withSyntopicaConfig(config, body)

  it('spells the ledger, the index and the curated domains from the config', () => {
    nested(() => {
      expect(ledgerRelativePath(CLIP)).toBe(`brain/.ingest/clips/${CLIP}.json`)
      expect(indexRepositoryPath()).toBe('brain/index.md')
      expect(sensitiveDomainsPath(data)).toBe(
        `${data}/brain/.ingest/sensitive-domains.txt`,
      )
    })
  })

  it('keeps the triage drop zone beside the pages, not at the repository root', () => {
    nested(() => {
      expect(triageRootPath(data)).toBe(
        join(data, 'brain', 'inbox', 'newsletter-triage'),
      )
    })
  })

  it('converts repository paths to page paths and only those under the root', () => {
    nested(() => {
      expect(wikiPagePath('brain/notes/a.md')).toBe('notes/a.md')
      expect(wikiPagePath('notes/a.md')).toBeNull()
      expect(wikiPagePath('brainy/notes/a.md')).toBeNull()
      expect(isConfiguredPagePath('notes/a.md')).toBe(true)
      expect(isConfiguredPagePath('topics/a.md')).toBe(false)
    })
  })

  it('still keeps a sensitive page from an automatic reviewer', () => {
    // The refusal matched ` a/business/`, which a nested diff header never
    // contains: after the move it would have sent credential pages out.
    nested(() => {
      expect(
        sensitiveDiffRefusal(
          'diff --git a/brain/business/keys.md b/brain/business/keys.md\n',
        ),
      ).toContain('business/')
      expect(
        sensitiveDiffRefusal(
          'diff --git a/brain/notes/a.md b/brain/notes/a.md\n',
        ),
      ).toBeNull()
    })
  })

  it('reads index removals from the nested index', () => {
    nested(() => {
      expect(
        diffNeedsHuman(
          [
            'diff --git a/brain/index.md b/brain/index.md',
            '--- a/brain/index.md',
            '+++ b/brain/index.md',
            '-## Notes',
          ].join('\n'),
        ),
      ).toContain('section heading')
    })
  })

  it('tells the synthesizer the configured directories and how links are spelled', () => {
    nested(() => {
      const prompt = codexPrompt('/clip/index.md', '')
      expect(prompt).toContain('Pages live only under brain/notes/.')
      expect(prompt).toContain('brain/notes/name.md is [[notes/name]]')
      expect(prompt).toContain('Do NOT touch brain/index.md')
      expect(prompt).toContain('do not touch brain/.ingest/')
    })
  })

  it('pins relative engine paths absolute for a worktree elsewhere', () => {
    // The fixture names its engines `../engine-brain`, which from a temporary
    // ingest worktree names nothing; the index builder refused exactly that.
    nested(() => {
      expect(worktreeEngineOverlay()).toEqual({
        engines: {
          brain: { path: join(dirname(data), 'engine-brain') },
          clips: { path: join(dirname(data), 'engine-clips') },
        },
      })
    })
  })
})
