import { describe, expect, it } from 'vitest'
import { parseArguments } from './parse-arguments.ts'

describe('parseArguments', () => {
  it('defaults to help with no arguments', () => {
    expect(parseArguments([])).toEqual({
      command: 'help',
      clip: null,
      limit: null,
      dryRun: false,
      grade: false,
      manual: false,
      promote: false,
      autoReview: false,
      captureAll: false,
      cited: false,
      source: null,
      date: null,
      since: null,
      pages: [],
    })
  })

  it('reads a bare command', () => {
    expect(parseArguments(['status'])).toEqual({
      command: 'status',
      clip: null,
      limit: null,
      dryRun: false,
      grade: false,
      manual: false,
      promote: false,
      autoReview: false,
      captureAll: false,
      cited: false,
      source: null,
      date: null,
      since: null,
      pages: [],
    })
  })

  it('reads --clip and --dry-run on ingest', () => {
    expect(
      parseArguments(['ingest', '--clip', '01KYFXAB', '--dry-run']),
    ).toEqual({
      command: 'ingest',
      clip: '01KYFXAB',
      limit: null,
      dryRun: true,
      grade: false,
      manual: false,
      promote: false,
      autoReview: false,
      captureAll: false,
      cited: false,
      source: null,
      date: null,
      since: null,
      pages: [],
    })
  })

  it('reads --promote on harvest', () => {
    expect(parseArguments(['harvest', '--promote'])).toEqual({
      command: 'harvest',
      clip: null,
      limit: null,
      dryRun: false,
      grade: false,
      manual: false,
      promote: true,
      autoReview: false,
      captureAll: false,
      cited: false,
      source: null,
      date: null,
      since: null,
      pages: [],
    })
  })

  it('reads --source on harvest', () => {
    expect(parseArguments(['harvest', '--source', 'medium-list'])).toEqual({
      command: 'harvest',
      clip: null,
      limit: null,
      dryRun: false,
      grade: false,
      manual: false,
      promote: false,
      autoReview: false,
      captureAll: false,
      cited: false,
      source: 'medium-list',
      date: null,
      since: null,
      pages: [],
    })
  })

  it('reads --date on harvest', () => {
    expect(
      parseArguments(['harvest', '--promote', '--date', '2026-07-30']),
    ).toEqual({
      command: 'harvest',
      clip: null,
      limit: null,
      dryRun: false,
      grade: false,
      manual: false,
      promote: true,
      autoReview: false,
      captureAll: false,
      cited: false,
      source: null,
      date: '2026-07-30',
      since: null,
      pages: [],
    })
  })

  it('rejects an unknown command rather than guessing', () => {
    expect(() => parseArguments(['refresh'])).toThrow(
      /unknown command: refresh/,
    )
  })

  it('rejects an unknown flag', () => {
    expect(() => parseArguments(['status', '--yes'])).toThrow(
      /unknown option: --yes/,
    )
  })

  it('rejects --clip without a value', () => {
    expect(() => parseArguments(['ingest', '--clip'])).toThrow(
      /--clip needs a value/,
    )
  })

  it('rejects --source without a value', () => {
    expect(() => parseArguments(['harvest', '--source'])).toThrow(
      /--source needs a value/,
    )
  })

  it('rejects --source followed by another flag', () => {
    expect(() => parseArguments(['harvest', '--source', '--dry-run'])).toThrow(
      /--source needs a value/,
    )
  })

  it('rejects --date without a value', () => {
    expect(() => parseArguments(['harvest', '--date'])).toThrow(
      /--date needs a value/,
    )
  })

  it('rejects a misshapen --date', () => {
    expect(() => parseArguments(['harvest', '--date', '30-07-2026'])).toThrow(
      /--date must be a real YYYY-MM-DD day: 30-07-2026/,
    )
  })

  it('rejects a date that looks well formed but is not a real day', () => {
    expect(() => parseArguments(['harvest', '--date', '2026-02-31'])).toThrow(
      /--date must be a real YYYY-MM-DD day: 2026-02-31/,
    )
  })

  it('reads --limit on drain', () => {
    expect(parseArguments(['drain', '--limit', '5']).limit).toBe('5')
  })

  it('reads --since on harvest', () => {
    expect(parseArguments(['harvest', '--since', '2026-07-01']).since).toBe(
      '2026-07-01',
    )
  })

  it('rejects a --since that is not a real day', () => {
    expect(() => parseArguments(['harvest', '--since', '2026-02-31'])).toThrow(
      '--since must be a real YYYY-MM-DD day: 2026-02-31',
    )
  })
})
