/** How much cited evidence the Cursor transport may be handed, in bytes.
 *
 * This module existed, was deleted on 2026-09-11 in the belief that moving the
 * prompt from argv to stdin had removed every size limit, and is back the same
 * day because that belief was wrong and the measurement that disproved it
 * arrived late. **A pipe is not unbounded here either**: 480 KB on stdin
 * answers, 800 KB returns an empty stdout with exit 0 - the same silent shape
 * argv produced above 400 KB, just further out. Whatever gives up inside the
 * CLI is not the kernel's argv limit, because the pipe moved the number without
 * removing the behaviour.
 *
 * 512 KB is the ceiling rather than something nearer the measured cliff for two
 * reasons. It is barely above the largest prompt actually verified end to end -
 * `topics/architecture-economics` at 479,816 evidence bytes, graded with real
 * findings - so it promises almost nothing that has not been seen working. And
 * it is the number `AGY_EVIDENCE_CEILING_BYTES` already carries, so the wiki
 * has one figure to remember for "how much evidence fits in an inlined prompt"
 * rather than two that differ for reasons nobody will recall.
 *
 * The cost of being wrong here is asymmetric, which is why it is set low. Over
 * the ceiling a page is refused up front with its byte count attached, and the
 * operator knows exactly what happened. Under a ceiling set too high it is the
 * silent empty answer, which reads as a page that could not be graded for no
 * stated reason - and that is the failure that cost this lane a session. */
export const CURSOR_EVIDENCE_CEILING_BYTES = 512 * 1024
