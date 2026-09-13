/** Flush collection in the page runtime. */
export async function flushCollection(context, force) {
  if (
    context.state.chunk.length === 0 ||
    (context.state.chunk.length < context.config.CHUNK && !force)
  )
    return
  const payload = context.state.chunk
  context.state.chunk = []
  context.helpers.emitPayload(
    context,
    'chatgpt-' +
      context.state.RUN +
      '-part-' +
      String(context.state.part).padStart(3, '0') +
      '.json',
    {
      exported: payload,
    },
  )
  context.state.part += 1
  await new Promise((resolve) => setTimeout(resolve, 1200))
}
