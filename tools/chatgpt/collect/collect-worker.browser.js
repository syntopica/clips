/** Collect worker in the page runtime. */
export async function collectWorker(context) {
  for (;;) {
    const index = context.state.cursor
    context.state.cursor += 1
    if (index >= context.state.todo.length) return
    const summary = context.state.todo[index]
    try {
      const tree = await context.helpers.fetchConversation(
        context,
        '/conversation/' + summary.id,
      )
      context.state.chunk.push({ summary, tree })
    } catch (error) {
      context.state.chunk.push({ summary, tree: null, error: String(error) })
    }
    context.state.done += 1
    context.state.publish('')
    await context.helpers.flushCollection(context, false)
    await new Promise((resolve) => setTimeout(resolve, context.state.pace))
  }
}
