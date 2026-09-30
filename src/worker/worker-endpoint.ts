import { readFileSync } from 'node:fs'

/** Where the worker coordinator listens and the producer token it expects.
 *
 * Read from the environment at call time, the way atrium's worker lane reads
 * its own pair: the address and the token belong to the instance, and a
 * default here would be one machine's port presented as the engine's. The
 * token is a file, never a value, so it cannot land in a shell history or a
 * configuration document. Missing either stops with the variables to set. */
export const workerEndpoint = (
  environ: NodeJS.ProcessEnv = process.env,
): { url: string; token: string } => {
  const url = environ['CLIPS_WORKER_URL']
  const tokenFile = environ['CLIPS_WORKER_TOKEN_FILE']
  if (url === undefined || url === '' || tokenFile === undefined || tokenFile === '')
    throw new Error(
      'The worker transport needs CLIPS_WORKER_URL and CLIPS_WORKER_TOKEN_FILE ' +
        '(a producer token issued by `worker token add --kind producer`).',
    )
  return {
    url: url.replace(/\/+$/, ''),
    token: readFileSync(tokenFile, 'utf8').trim(),
  }
}
