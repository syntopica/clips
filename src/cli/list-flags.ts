import type { ListFlagKey } from './list-flag-key.ts'

/** Flag spelling to the list the next argument is appended to. Separate from
 * VALUE_FLAGS because repeating a value flag overwrites while repeating one of
 * these accumulates - `grade --page a.md --page b.md` grades both. */
export const LIST_FLAGS: Record<string, ListFlagKey> = {
  '--page': 'pages',
}
