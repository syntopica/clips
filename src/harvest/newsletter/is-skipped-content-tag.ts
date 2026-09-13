/** Whether a tag's text is markup rather than content.
 *
 * A Medium email opens with a `<style>` block of several thousand characters,
 * and a converter that treats it as text emits the whole stylesheet - which is
 * exactly what `turndown` did here before this lane stopped using it. */
export const isSkippedContentTag = (name: string): boolean =>
  name === 'style' || name === 'script'
