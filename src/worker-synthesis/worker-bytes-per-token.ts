/** Bytes of prompt counted per token of context when a prompt is checked
 * against a worker model's window.
 *
 * English prose runs near four bytes a token; wiki pages carry code, paths and
 * markdown that tokenize worse, so three is the conservative figure. Over-
 * counting refuses a clip another transport can take; under-counting hands the
 * model a prompt it silently truncates, dropping the untrusted-data markers at
 * its head first. */
export const WORKER_BYTES_PER_TOKEN = 3
