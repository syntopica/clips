import { currentSyntopicaConfig } from '../config/current-syntopica-config.ts'
import { wikiLayoutOf } from './wiki-layout-of.ts'
import type { WikiLayout } from './wiki-layout.ts'

/** The layout of the instance in scope, read at call time like every other
 * configured value. */
export const currentWikiLayout = (): WikiLayout =>
  wikiLayoutOf(currentSyntopicaConfig())
