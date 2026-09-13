/** How much cited evidence the agy transport may be handed, and it is a
 * different kind of limit from the codex one.
 *
 * agy has no working-directory flag and, told to read a path, either skims it
 * or spends minutes searching the filesystem, so `runAgyGrade` inlines the full
 * text of the page and every source into one argv string. That string is
 * bounded by the operating system, not by the clock: `spawn E2BIG` at 1068 KB
 * of sources on a host whose `ARG_MAX` is 1 MB, found on 2026-08-03 by raising
 * the shared budget and watching this transport fail where codex would not.
 *
 * 512 KB because that is the number that was demonstrably working - the shared
 * budget from 2026-08-02 until the split, under which agy graded pages without
 * ever hitting this. Anything larger is a guess about how much room the page
 * text and the instructions leave in the same argv.
 *
 * codex has no equivalent ceiling because it is handed paths and reads the
 * files itself under `-s read-only`; there, `EVIDENCE_BYTE_BUDGET` and the
 * scaled timeout are the real limits. A page above this grades on codex. */
export const AGY_EVIDENCE_CEILING_BYTES = 512 * 1024
