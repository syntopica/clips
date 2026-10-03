import { describe, expect, it } from 'vitest'
import { intakePerDay } from './intake-per-day.ts'

const now = new Date('2026-08-30T10:00:00.000Z')

describe('intakePerDay', () => {
  it('returns thirty UTC days ending today, zero-filled, oldest first', () => {
    const days = intakePerDay([], now)
    expect(days).toHaveLength(30)
    expect(days[0]).toEqual({ day: '2026-08-01', count: 0 })
    expect(days[29]).toEqual({ day: '2026-08-30', count: 0 })
  })

  it('counts by UTC day and ignores captures outside the window', () => {
    const days = intakePerDay(
      [
        Date.parse('2026-08-30T00:00:00.000Z'),
        Date.parse('2026-08-30T23:59:59.999Z'),
        Date.parse('2026-08-29T23:59:59.999Z'),
        Date.parse('2026-08-01T00:00:00.000Z'),
        Date.parse('2026-07-31T23:59:59.999Z'),
      ],
      now,
    )
    expect(days.at(-1)).toEqual({ day: '2026-08-30', count: 2 })
    expect(days.at(-2)).toEqual({ day: '2026-08-29', count: 1 })
    expect(days[0]).toEqual({ day: '2026-08-01', count: 1 })
    expect(days.reduce((sum, day) => sum + day.count, 0)).toBe(4)
  })
})
