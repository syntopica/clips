import { MAX_CLIP_DIR_NAME_CHARS } from './max-clip-dir-name-chars.ts'
import { slugify } from './slugify.ts'

/** `<date>-<site>-<title>-<clipId[:8]>`, matching what the Chrome extension
 * produces so both lanes' clips sort and read alike. The title is what gets
 * truncated when the budget runs out - the date, site and id suffix all carry
 * information that cannot be recovered from elsewhere in the name. */
export const clipDirectoryName = (
  date: string,
  site: string,
  title: string,
  clipId: string,
): string => {
  const suffix = clipId.slice(0, 8).toLowerCase()
  const sitePart = slugify(site)
  const budget =
    MAX_CLIP_DIR_NAME_CHARS - date.length - sitePart.length - suffix.length - 3
  const titlePart = slugify(title)
    .slice(0, Math.max(budget, 0))
    .replace(/-+$/u, '')
  return [date, sitePart, titlePart, suffix]
    .filter((part) => part !== '')
    .join('-')
}
