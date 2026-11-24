/** What a synthesis job needs from the model that runs it: the chat capability,
 * the pinned model and, only when there are any, the providers that must never
 * run it. */
export const workerSynthesisRequirements = (
  model: string,
  excluded: readonly string[],
): Record<string, unknown> => ({
  capability: 'chat.json',
  models: [model],
  ...(excluded.length === 0 ? {} : { exclude_providers: [...excluded] }),
})
