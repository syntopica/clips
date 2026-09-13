/** How many bytes of cited evidence one grading run may be handed.
 *
 * There was no budget until 2026-08-02, and the failure it produced is why this
 * is a pre-flight check rather than a timeout: [[topics/llm-wiki]] cites 47
 * sources totalling 776 KB, which the grader read until `runCodexGrade`'s ten
 * minutes ran out, returning exit 1 with a fragment of a clip on stderr. The
 * page had graded cleanly the same day at 685 KB, so it had been sitting just
 * under the real limit without anyone knowing there was one.
 *
 * It was 512 KB until 2026-08-03, and at that number it was refusing pages
 * rather than protecting them: [[topics/agent-harnesses]] came back over budget
 * at 1068 KB and [[topics/agent-automation]] at 611 KB, so the wiki's two
 * largest hubs became the pages nothing verified - and both had got there by
 * accumulating sources exactly as hub-first tells them to. The tension is real
 * and it is resolved in favour of the hubs: `gradeTimeoutMs` scales the clock
 * with the evidence instead, because the clock was always the binding limit.
 *
 * 2 MB is where that scaling stops. It is the forty-minute cap converted to
 * bytes at the same ten-minutes-per-512-KB rate, so this number and the timeout
 * ceiling are two statements of one fact: past here, no amount of waiting
 * finishes, and refusing up front with the numbers attached beats a bare kill
 * forty minutes later. */
export const EVIDENCE_BYTE_BUDGET = 2 * 1024 * 1024
