import { homedir } from 'node:os'
import { join } from 'node:path'

export const BRAIN_REPOSITORY_PATH = join(homedir(), 'p', 'brain')
