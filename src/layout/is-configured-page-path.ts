import { currentWikiLayout } from './current-wiki-layout.ts'

/** Whether a page path lies under one of the configured page directories. */
export const isConfiguredPagePath = (pagePath: string): boolean =>
  currentWikiLayout().pageDirectories.some((directory) =>
    pagePath.startsWith(`${directory}/`),
  )
