import { describe, expect, it } from 'vitest'
import { parseDataArguments } from './parse-data-arguments.ts'

describe('parseDataArguments', () => {
  it('preserves existing command arguments', () => {
    expect(parseDataArguments(['status'])).toEqual({
      explicit: undefined,
      arguments: ['status'],
    })
  })
  it('removes the explicit data option without changing command flags', () => {
    expect(
      parseDataArguments(['--data', '../instance', 'ingest', '--dry-run']),
    ).toEqual({ explicit: '../instance', arguments: ['ingest', '--dry-run'] })
  })
  it.each([
    { argv: ['--data'] },
    { argv: ['--data', ''] },
    { argv: ['--data', '--help'] },
  ])('rejects a missing path in %j', ({ argv }) => {
    expect(() => parseDataArguments(argv)).toThrow('syntopica.config.json')
  })
})
