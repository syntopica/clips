/** Read the collector's existing page configuration. */
export function readCollectionOptions() {
  const CHUNK = Number(window.__cgChunk || 10)
  const WORKERS = Number(window.__cgWorkers || 1)
  const PACE = Number(window.__cgPace || 4000)
  const COOLDOWN = Number(window.__cgCooldown || 900000)
  const BURST_END = Number(window.__cgBurstEnd || 4)

  return { CHUNK, WORKERS, PACE, COOLDOWN, BURST_END }
}
