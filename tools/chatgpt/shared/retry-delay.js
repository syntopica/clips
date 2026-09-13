/** Calculate the existing capped retry delay from the response and pace. */
export function retryDelay(response, pace, attempt) {
  const header = Number(response.headers.get('retry-after'))
  return Number.isFinite(header) && header > 0
    ? Math.min(header * 1000, 120000)
    : Math.min(Math.max(pace, 2000 * 2 ** attempt), 120000)
}
