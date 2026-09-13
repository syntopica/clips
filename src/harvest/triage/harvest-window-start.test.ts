import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { defaultWindowStart } from './default-window-start.ts'
import { harvestWindowStart } from './harvest-window-start.ts'
import { NEWSLETTER_SWEEP_MARKER } from './newsletter-sweep-marker.ts'

/** The most recent run that read newsletters in every fixture. */
const LAST_SWEEP = '2026-07-30'
/** The date of the run being started. */
const RUN_DATE = '2026-08-08'

const brainWith = (runs: readonly (readonly [string, boolean])[]): string => {
  const brain = mkdtempSync(join(tmpdir(), 'harvest-window-'))
  for (const [date, swept] of runs) {
    const directory = join(brain, 'inbox', 'newsletter-triage', date)
    mkdirSync(directory, { recursive: true })
    writeFileSync(join(directory, 'other.md'), '# triage\n')
    if (swept)
      writeFileSync(join(directory, NEWSLETTER_SWEEP_MARKER), '{"since":"x"}\n')
  }
  return brain
}

describe('harvestWindowStart', () => {
  it('starts from the most recent run that read newsletters', () => {
    const brain = brainWith([
      ['2026-07-29', true],
      [LAST_SWEEP, true],
    ])

    expect(harvestWindowStart(brain, RUN_DATE)).toBe(LAST_SWEEP)
  })

  it('ignores a run that wrote triage without reading newsletters', () => {
    // `--source medium-list` writes a dated directory and exits successful.
    // Letting it move the window loses every newsletter since the last real
    // sweep, permanently, because the window only travels forward.
    const brain = brainWith([
      [LAST_SWEEP, true],
      ['2026-08-06', false],
    ])

    expect(harvestWindowStart(brain, RUN_DATE)).toBe(LAST_SWEEP)
  })

  it('ignores a run dated on or after the one being started', () => {
    const brain = brainWith([
      [LAST_SWEEP, true],
      ['2026-09-01', true],
    ])

    expect(harvestWindowStart(brain, RUN_DATE)).toBe(LAST_SWEEP)
  })

  it('falls back to the bounded floor when nothing has swept yet', () => {
    // The state of a fresh clone: `inbox/` is gitignored. Reading everything
    // here is what aborts the process on memory and floods classification.
    const brain = brainWith([[LAST_SWEEP, false]])

    expect(harvestWindowStart(brain, RUN_DATE)).toBe(
      defaultWindowStart(RUN_DATE),
    )
    expect(defaultWindowStart(RUN_DATE)).toBe('2026-07-09')
  })

  it('falls back to the floor when no triage directory exists at all', () => {
    const brain = mkdtempSync(join(tmpdir(), 'harvest-window-empty-'))

    expect(harvestWindowStart(brain, RUN_DATE)).toBe('2026-07-09')
  })
})
