import { z } from 'zod'

/** One page of the reading list. `catalogsByUser` is asked for
 * `PREDEFINED_LIST`, which yields exactly one catalog, so the reading list is
 * `catalogs[0]`; an empty `catalogs` array is an empty page rather than a
 * crash. Items stay loose here so a non-`Post` entity survives to be filtered
 * out by `__typename` instead of failing the page.
 * docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md:130-181 */
export const READING_LIST_PAGE_SCHEMA = z.object({
  data: z.object({
    catalogsByUser: z.object({
      catalogs: z.array(
        z.object({
          itemsConnection: z.object({
            items: z.array(
              z.object({
                entity: z.looseObject({ __typename: z.string() }),
              }),
            ),
            paging: z.object({
              nextPageCursor: z.object({ id: z.string() }).nullish(),
            }),
          }),
        }),
      ),
    }),
  }),
})
