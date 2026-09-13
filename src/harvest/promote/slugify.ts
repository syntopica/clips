/** Lowercase ASCII slug for a directory name: accents folded, everything else
 * collapsed to single hyphens. Medium titles carry curly quotes, em dashes and
 * emoji, none of which belong in a path that a human types at a shell. */
export const slugify = (value: string): string =>
  value
    .normalize('NFKD')
    .replaceAll(/[\u0300-\u036F]/gu, '')
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, '-')
    .replaceAll(/^-+|-+$/gu, '')
