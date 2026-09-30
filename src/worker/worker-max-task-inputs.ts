/** How many input files the worker copies into one task's workspace; the
 * coordinator rejects a longer manifest outright. */
export const WORKER_MAX_TASK_INPUTS = 64
