import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

/** `execFile` as a promise. Shared by the Spark wrappers so neither of them
 * has to hold a private `promisify` binding at module scope. */
export const runCommand = promisify(execFile)
