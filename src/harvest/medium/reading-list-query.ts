/** The reading list operation, reconstructed on 2026-07-29 by mining Medium's
 * client bundles and using validation errors as an oracle (introspection is
 * refused). Verified against the live endpoint: it returned all 20 saved posts
 * with titles and `mediumUrl`.
 * docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md:108-181.
 *
 * The saved articles are not in `User.readingList` and not in the named lists;
 * they live in the predefined catalog
 * `predefined:<userId>:READING_LIST`, reached with `type: PREDEFINED_LIST`.
 * Because the document is reconstructed rather than published, any validation
 * error against it is schema drift and must fail the run - see
 * `MediumGraphqlError`. */
export const READING_LIST_QUERY = `query ReadingList(
  $u: ID!, $cp: CatalogPagingOptionsInput!,
  $ip: CatalogPagingOptionsInput!, $t: CatalogType!
) {
  catalogsByUser(userId: $u, pagingOptions: $cp, type: $t) {
    catalogs {
      id
      itemsConnection(pagingOptions: $ip) {
        items {
          entity {
            __typename
            ... on Post {
              id title mediumUrl uniqueSlug readingTime firstPublishedAt
              creator { name username }
            }
          }
        }
        paging { nextPageCursor { id } }
      }
    }
  }
}`
