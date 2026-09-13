/** How long one grading run may take before it is killed, scaled to how much
 * evidence it was handed.
 *
 * A flat ten minutes until 2026-08-03, and that constant is what the evidence
 * budget was really protecting: [[topics/llm-wiki]] graded cleanly at 685 KB
 * and ran out of time at 776 KB, so the binding limit was never the model's
 * context - it was the clock. The budget then rejected the pages that took
 * longest, which put per-page grading in direct conflict with hub-first
 * granularity: a hub accumulates sources exactly as it is told to, and was
 * refused for doing it. Two hubs had crossed the line by 2026-08-03, both by
 * working as designed.
 *
 * Hub-first wins and the clock scales instead. Ten minutes per 512 KB, the
 * throughput those two observations bracket, floored at ten so a small page is
 * unaffected and capped at forty so a runaway run still dies. That cap is what
 * `EVIDENCE_BYTE_BUDGET` now expresses in bytes: past 2 MB not even the whole
 * budget of time will finish, so a pre-flight refusal is still the honest
 * answer there. */
export const gradeTimeoutMs = (evidenceBytes: number): number =>
  Math.min(4, Math.max(1, Math.ceil(evidenceBytes / (512 * 1024)))) * 600_000
