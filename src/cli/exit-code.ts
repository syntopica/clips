/** Process exit statuses. The design fixes error codes as strings but no exit
 * status, and the shell wrapper is not useful without one. */
export const EXIT_CODE = {
  success: 0,
  fatalLocal: 1,
  clipsStopped: 2,
  lockHeld: 3,
  /** The synthesis transport ran out of capacity; the run stopped with the
   * clip still pending. */
  exhausted: 4,
  interrupted: 130,
} as const
