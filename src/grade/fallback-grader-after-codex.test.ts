import { describe, expect, it } from 'vitest'
import { CURSOR_IDENTITY_MODEL } from '../cursor/cursor-identity-model.ts'
import { AGY_BULK_MODEL } from '../models/agy-bulk-model.ts'
import { AGY_FINE_MODEL } from '../models/agy-fine-model.ts'
import { INTERACTIVE_IDENTITY } from '../synthesis/interactive-identity.ts'
import { agyFineGrader } from './agy-fine-grader.ts'
import { cursorGrader } from './cursor-grader.ts'
import { fallbackGraderAfterCodex } from './fallback-grader-after-codex.ts'

describe('fallbackGraderAfterCodex', () => {
  describe('with no author to ask, reading the environment', () => {
    it('grades on cursor when synthesis was confined to codex', () => {
      expect(fallbackGraderAfterCodex(null, 'codex')).toBe(cursorGrader)
    })

    it('grades on cursor when the fine model wrote the batch', () => {
      // Was agy-bulk until 2026-09-11. Stepping down to Gemini was the best
      // answer available while agy was the only fallback; a fine-tier model on
      // an account that wrote nothing is strictly better than a cheaper one.
      expect(fallbackGraderAfterCodex(null, 'agy-fine')).toBe(cursorGrader)
    })

    it('grades on cursor when the bulk model wrote the batch', () => {
      expect(fallbackGraderAfterCodex(null, 'agy-bulk')).toBe(cursorGrader)
    })

    it('grades the default transport on cursor instead of refusing', () => {
      // This case threw until 2026-09-11, and the refusal was correct at the
      // time: unpinned synthesis may use either agy model, so every fallback
      // then wired was a possible author. It is the shape that left the
      // 2026-08-24 batch ungraded. A fourth account ends it.
      expect(fallbackGraderAfterCodex(null, undefined)).toBe(cursorGrader)
      expect(fallbackGraderAfterCodex(null, 'fallback')).toBe(cursorGrader)
    })

    it('falls back to the fine tier when cursor itself wrote the batch', () => {
      expect(fallbackGraderAfterCodex(null, 'cursor')).toBe(agyFineGrader)
    })
  })

  describe('with the author the run reported', () => {
    it('grades an interactive batch on cursor, unpinned', () => {
      // The 2026-08-03 failure: a Claude session in the operator's terminal
      // wrote the pages, so no unattended model could have been the author, and
      // the environment's worst case refused a batch that was provably safe.
      expect(
        fallbackGraderAfterCodex(INTERACTIVE_IDENTITY.model, undefined),
      ).toBe(cursorGrader)
    })

    it('believes the author over an environment that disagrees', () => {
      // selectSynthesizer overrides CLIPS_SYNTHESIS_RUNNER on --manual, on a
      // disabled boundary decision and on a missing binary. The variable says
      // cursor; the interactive synthesizer is what actually ran, so cursor is
      // free and the variable's claim that it is not carries no weight.
      expect(
        fallbackGraderAfterCodex(INTERACTIVE_IDENTITY.model, 'cursor'),
      ).toBe(cursorGrader)
    })

    it('refuses the cursor tier when cursor is the author', () => {
      expect(fallbackGraderAfterCodex(CURSOR_IDENTITY_MODEL, 'fallback')).toBe(
        agyFineGrader,
      )
    })

    it('still refuses the fine tier when the fine model is the author', () => {
      expect(fallbackGraderAfterCodex(AGY_FINE_MODEL, 'fallback')).toBe(
        cursorGrader,
      )
    })

    it('still refuses the bulk tier when the bulk model is the author', () => {
      expect(fallbackGraderAfterCodex(AGY_BULK_MODEL, 'fallback')).toBe(
        cursorGrader,
      )
    })

    it('refuses an author it cannot place, rather than reading it as harmless', () => {
      // A new transport must widen gradeTiersOfAuthor before its pages can be
      // graded. Defaulting an unknown model to "wrote nothing" would let the
      // next transport added here verify itself on its first batch - and cursor
      // was exactly that transport on 2026-09-11.
      expect(() => fallbackGraderAfterCodex('some-new-model', 'codex')).toThrow(
        /the author verifying itself/,
      )
    })

    it('names both pins in the refusal, so the operator has an exit', () => {
      expect(() => fallbackGraderAfterCodex('some-new-model', 'codex')).toThrow(
        /CLIPS_GRADE_RUNNER.*CLIPS_SYNTHESIS_RUNNER/s,
      )
    })

    it('reports the author in the refusal, not just the variable', () => {
      expect(() => fallbackGraderAfterCodex('some-new-model', 'codex')).toThrow(
        /author=some-new-model/,
      )
    })
  })
})
