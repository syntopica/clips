/** How large a synthesis prompt this transport may be handed, in bytes.
 *
 * agy has no working-directory flag and, told to read a path, either skims it
 * or spends minutes hunting the filesystem - the finding behind
 * `agySynthesisPrompt` inlining the whole clip. So the clip text travels as an
 * `execFile` argument, and the limit on it is the operating system rather than
 * the model's context: `ARG_MAX` is 1048576 on this host, shared by every argv
 * string and the environment alongside them.
 *
 * 512 KB for the same reason the grade lane's `AGY_EVIDENCE_CEILING_BYTES`
 * carries that number: it is the size demonstrably working there against this
 * binary, on this host, through this same `execFile`. The two constants state
 * one host fact seen from two lanes, and they are separate because the lanes
 * measure different things - a set of evidence files there, one prompt string
 * here.
 *
 * codex has no equivalent ceiling: `codexPrompt` hands it the clip's path and
 * it reads the file itself, so an oversized clip is a context question there
 * and not a spawn one. That is why the refusal names codex as the remedy. */
export const AGY_PROMPT_CEILING_BYTES = 512 * 1024
