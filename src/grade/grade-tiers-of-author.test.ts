import { describe, expect, it } from 'vitest'
import { CODEX_IDENTITY_MODEL } from '../codex/codex-identity-model.ts'
import { AGY_BULK_MODEL } from '../models/agy-bulk-model.ts'
import { AGY_FINE_MODEL } from '../models/agy-fine-model.ts'
import { INTERACTIVE_IDENTITY } from '../synthesis/interactive-identity.ts'
import { gradeTiersOfAuthor } from './grade-tiers-of-author.ts'

describe('gradeTiersOfAuthor', () => {
  it('rules out nothing for an interactive author', () => {
    // Not a grading model at all: the pages were written by a Claude session in
    // the operator's own terminal, so every tier is free to verify them.
    expect(gradeTiersOfAuthor(INTERACTIVE_IDENTITY.model)).toEqual([])
  })

  it('rules out the codex tier for a codex author', () => {
    expect(gradeTiersOfAuthor(CODEX_IDENTITY_MODEL)).toEqual(['codex'])
  })

  it('rules out the fine tier for its model', () => {
    expect(gradeTiersOfAuthor(AGY_FINE_MODEL)).toEqual(['agy-fine'])
  })

  it('rules out the bulk tier for its model', () => {
    expect(gradeTiersOfAuthor(AGY_BULK_MODEL)).toEqual(['agy-bulk'])
  })

  it('returns null for a model it does not recognise', () => {
    // Deliberately not the empty set. A new transport widens this map before
    // its pages can be graded, rather than being read as harmless by default.
    expect(gradeTiersOfAuthor('gpt-oss-120b-medium')).toBeNull()
  })
})
