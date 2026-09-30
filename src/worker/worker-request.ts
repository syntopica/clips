import { workerEndpoint } from './worker-endpoint.ts'

/** One authenticated JSON request to the worker coordinator.
 *
 * A refusal throws with the coordinator's error code, which contract v1 keeps
 * free of provider and generated text, so the message is safe to print. */
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
  if (!response.ok) {
    let code = 'unknown'
    try {
      code = String((JSON.parse(text) as { error?: unknown }).error ?? code)
    } catch {
      // A non-JSON refusal keeps the generic code.
    }
    throw new Error(`worker ${method} ${path} refused: ${String(response.status)} ${code}`)
  }
  return text === '' ? null : (JSON.parse(text) as unknown)
}
