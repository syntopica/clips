/** Text reduced to what a quotation and its source have to agree on.
 *
 * Case, whitespace runs, line breaks and the punctuation a publisher's
 * typography differs in - curly quotes, apostrophes, en and em dashes,
 * ellipsis. A quotation that survives a copy through markdown, prettier's
 * rewrapping and this repository's ASCII text hygiene rule is not the same
 * byte string as the source it came from, and reporting that difference as a
 * misquote would be a check nobody could act on.
 *
 * What it deliberately does not touch is the words. Dropping a word, adding
 * one, or changing one is what this is for. */
export const normalizedQuote = (text: string): string =>
  text
    .toLowerCase()
    .replaceAll(/[“”]/g, '"')
    .replaceAll(/[‘’]/g, "'")
    .replaceAll(/[—–]/g, '-')
    .replaceAll('…', '...')
    .replaceAll(/\s+/g, ' ')
    .trim()
