/** The page the viewer id is read from. `/me/lists` is a client-side shell
 * carrying no posts, which is exactly what is wanted here: it is the cheapest
 * authenticated page that still embeds the Apollo state. */
export const MEDIUM_LISTS_URL = 'https://medium.com/me/lists'
