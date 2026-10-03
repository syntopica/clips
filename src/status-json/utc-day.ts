/** YYYY-MM-DD of an epoch-millisecond instant, in UTC. */
export const utcDay = (time: number): string =>
  new Date(time).toISOString().slice(0, 10)
