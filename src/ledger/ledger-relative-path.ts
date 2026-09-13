/** Repository-relative, forward slashes, because git takes it as a pathspec
 * (`cat-file -e origin/main:<path>`) as well as the filesystem. One definition
 * so the two spellings cannot drift apart. */
export const ledgerRelativePath = (clipId: string): string =>
  `.ingest/clips/${clipId}.json`
