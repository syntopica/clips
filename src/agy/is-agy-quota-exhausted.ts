import { AGY_QUOTA_WALL_PATTERN } from './agy-quota-wall-pattern.ts'

/** Whether agy refused because this model family's quota is spent.
 *
 * agy does not exit non-zero for this: the run completes, the envelope carries
 * no verdict, and the message sits in the output the runner keeps as its
 * failure tail. So the check reads that tail, not an exit code.
 */
export const isAgyQuotaExhausted = (failureTail: string): boolean =>
  AGY_QUOTA_WALL_PATTERN.test(failureTail)
