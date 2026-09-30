import { join } from 'node:path'
import { currentWikiLayout } from '../layout/current-wiki-layout.ts'

/** Curated beside the ledgers, in the instance's `brain.ledger` directory. */
export const sensitiveDomainsPath = (brainRepository: string): string =>
  join(brainRepository, currentWikiLayout().ledger, 'sensitive-domains.txt')
