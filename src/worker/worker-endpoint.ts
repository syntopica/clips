import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { currentSyntopicaConfig } from '../config/current-syntopica-config.ts'
import { readWorkerInstance } from './read-worker-instance.ts'

/** Where the worker coordinator listens and the producer token it expects.
 *
 * Read from the instance's own worker directory: the address from
 * `worker/config.json`, the token from `worker/state/tokens/clips.token`,
 * which `worker token add --kind producer --name clips` writes. So a wiki that
 * runs the worker needs no setup here beyond that token.
 * `CLIPS_WORKER_URL` and `CLIPS_WORKER_TOKEN_FILE` override either one, for a
 * coordinator that lives elsewhere. The token is always a file, never a value,
 * so it cannot land in a shell history or a configuration document. */
export const workerEndpoint = (
  environ: NodeJS.ProcessEnv = process.env,
  dataRoot: () => string = () => currentSyntopicaConfig().dataRoot,
): { url: string; token: string } => {
  const envUrl = environ['CLIPS_WORKER_URL']
  const envToken = environ['CLIPS_WORKER_TOKEN_FILE']
  const url =
    envUrl === undefined || envUrl === ''
      ? `http://${readWorkerInstance(dataRoot()).listen}`
      : envUrl
  const tokenFile =
    envToken === undefined || envToken === ''
      ? join(dataRoot(), 'worker', 'state', 'tokens', 'clips.token')
      : envToken
  let token: string
  try {
    token = readFileSync(tokenFile, 'utf8').trim()
  } catch {
    throw new Error(
      `No worker producer token at ${tokenFile}. Issue one with ` +
        '`worker token add --kind producer --name clips`, or point ' +
        'CLIPS_WORKER_TOKEN_FILE at an existing one.',
    )
  }
  return { url: url.replace(/\/+$/, ''), token }
}
