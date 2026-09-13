import { isHarvestDate } from '../harvest/is-harvest-date.ts'
import { BOOLEAN_FLAGS } from './boolean-flags.ts'
import type { CliOptions } from './cli-options.ts'
import { LIST_FLAGS } from './list-flags.ts'
import { readFlagValue } from './read-flag-value.ts'
import { VALUE_FLAGS } from './value-flags.ts'

/** The flags of one command line, defaults applied, dispatched through the two
 * flag tables so an unknown spelling is the single fall-through case. */
export const parseOptions = (rest: string[]): CliOptions => {
  const options: CliOptions = {
    autoReview: false,
    captureAll: false,
    cited: false,
    clip: null,
    date: null,
    dryRun: false,
    grade: false,
    limit: null,
    manual: false,
    pages: [],
    promote: false,
    since: null,
    source: null,
  }
  for (let index = 0; index < rest.length; index += 1) {
    const option = rest[index] ?? ''
    const booleanKey = BOOLEAN_FLAGS[option]
    if (booleanKey !== undefined) {
      options[booleanKey] = true
      continue
    }
    const listKey = LIST_FLAGS[option]
    if (listKey !== undefined) {
      options[listKey].push(readFlagValue(rest, index, option))
      index += 1
      continue
    }
    const valueKey = VALUE_FLAGS[option]
    if (valueKey === undefined) throw new Error(`unknown option: ${option}`)
    const value = readFlagValue(rest, index, option)
    // Rejected here rather than downstream: an unparseable date otherwise reads
    // back as "no triage directory for that day", which is the same message a
    // correct date for a day that was never harvested produces.
    if (
      (valueKey === 'date' || valueKey === 'since') &&
      !isHarvestDate(value)
    ) {
      throw new Error(`--${valueKey} must be a real YYYY-MM-DD day: ${value}`)
    }
    options[valueKey] = value
    index += 1
  }
  return options
}
