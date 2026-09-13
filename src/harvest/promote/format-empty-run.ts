/** What a run with nothing to fetch says. The two wordings are not
 * interchangeable: with `--capture-all` the triage files themselves are empty,
 * while without it they are full of articles the user has not ticked, and
 * telling them to "tick the boxes" in the first case sends them looking for
 * boxes that do not exist. */
export const formatEmptyRun = (captureAll: boolean): string =>
  captureAll
    ? 'no articles in this run\n'
    : 'nothing ticked - tick the boxes you want, then rerun\n'
