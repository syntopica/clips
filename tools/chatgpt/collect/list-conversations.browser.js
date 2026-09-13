/* `total` in this response is not a count. It reads back as offset+limit+1
 * while more pages exist - 101 at offset 0, 401 at offset 300 on an account
 * with 8 archived chats - so it is a has-more hint and paging on it either
 * stops early or never stops. The page size is the terminator, and ids are
 * deduplicated because `order=updated` reshuffles under a live account. */

/** List conversations in the page runtime. */
export async function listConversations(context, archived) {
  const items = []
  const seen = new Set()
  let offset = 0
  for (;;) {
    const page = await context.helpers.fetchConversation(
      context,
      `/conversations?offset=${offset}&limit=100&order=updated&is_archived=${archived}`,
    )
    const batch = page.items || []
    let fresh = 0
    for (const item of batch) {
      if (seen.has(item.id)) continue
      seen.add(item.id)
      items.push({ ...item, archived })
      fresh += 1
    }
    window.__cgState = `listing ${archived ? 'archived' : 'active'}: ${items.length}`
    if (batch.length < 100 || fresh === 0) return items
    offset += batch.length
  }
}
