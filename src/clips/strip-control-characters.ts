import { CONTROL_CHARACTERS } from './control-characters.ts'

/** Titles, sites, directory names and reasons all arrive from a page nobody
 * here wrote. An ANSI escape in any of them can clear the reviewer's screen,
 * and a bare newline forges a line that looks exactly like one of ours. */
export const stripControlCharacters = (value: string): string =>
  value.replace(CONTROL_CHARACTERS, '')
