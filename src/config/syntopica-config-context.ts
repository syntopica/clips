import { AsyncLocalStorage } from 'node:async_hooks'
import type { SyntopicaConfig } from './syntopica-config.ts'

export const syntopicaConfigContext = new AsyncLocalStorage<SyntopicaConfig>()
