/** How large a synthesis prompt the Cursor transport may be handed, in bytes.
 *
 * The clip text is inlined, as it is for agy, so a prompt has a size and the
 * size has a limit. Unlike agy the limit is not `ARG_MAX`: this transport sends
 * the prompt down a pipe, and a pipe moved the number without removing the
 * behaviour. Swept 2026-09-11: 480, 560 and 640 KB all answer, 800 KB comes
 * back as an empty stdout with exit 0, so the cliff is somewhere between 640
 * and 800 KB and is not worth locating more precisely than that.
 *
 * 512 KB, the same figure `AGY_PROMPT_CEILING_BYTES` and both evidence ceilings
 * carry. Four constants stating one operational fact is deliberate: they are
 * measured against different things - one prompt string here, a set of files
 * there - and collapsing them would make a change to one silently move the
 * others. What they share is that 512 KB is the largest size anything in this
 * pipeline has been seen to survive.
 *
 * A clip over the ceiling is not a clip to split, which is why the refusal
 * points at codex: codex is handed the clip's path and reads the file itself,
 * so size is a context question there rather than a transport one. */
export const CURSOR_PROMPT_CEILING_BYTES = 512 * 1024
