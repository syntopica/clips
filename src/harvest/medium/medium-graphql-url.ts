/** Medium's private GraphQL endpoint. Not a published API: the operations sent
 * to it are reconstructed from the client bundles, which is why a validation
 * error is treated as schema drift rather than a transient failure. */
export const MEDIUM_GRAPHQL_URL = 'https://medium.com/_/graphql'
