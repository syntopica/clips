/** The coordinator's request ceiling when the instance's `worker/config.json`
 * sets no `max_payload_bytes`: the worker loader's own default, 1 MiB. */
export const WORKER_DEFAULT_MAX_PAYLOAD_BYTES = 1_048_576
