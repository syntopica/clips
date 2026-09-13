import type { z } from 'zod'
import type { LedgerSchema } from './ledger-schema.ts'

export type Ledger = z.infer<typeof LedgerSchema>
