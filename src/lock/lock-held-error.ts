export class LockHeldError extends Error {
  constructor(reason: string) {
    super(`another ingest run holds the lock: ${reason}`)
    this.name = 'LockHeldError'
  }
}
