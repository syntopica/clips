import { workerEndpoint } from './worker-endpoint.ts'
import { workerErrorCode } from './worker-error-code.ts'

/** One authenticated JSON request to the worker coordinator.
 *
 * A refusal throws with the coordinator's error code, never its body. */
export const workerRequest = async (
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
): Promise<unknown> => {
  const { url, token } = workerEndpoint()
  const response = await fetch(url + path, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(60_000),
  })
  const text = await response.text()
  if (!response.ok)
    throw new Error(
      `worker ${method} ${path} refused: ${String(response.status)} ${workerErrorCode(text)}`,
    )
  return text === '' ? null : (JSON.parse(text) as unknown)
}
