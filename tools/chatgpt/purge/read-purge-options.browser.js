/** Read the purge client's existing page configuration. */
export function readPurgeOptions() {
  const PACE = Number(window.__cgPurgePace || 1000)
  const BURST_END = Number(window.__cgPurgeBurstEnd || 4)
  const COOLDOWN = Number(window.__cgPurgeCooldown || 900000)
  const WORKERS = Number(window.__cgPurgeWorkers || 4)
  return { PACE, BURST_END, COOLDOWN, WORKERS }
}
