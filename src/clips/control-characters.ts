/** C0/C1 control characters and ANSI CSI escape sequences (`ESC [ ... letter`,
 * e.g. a clear-screen or a color code): the byte patterns that steer a
 * terminal rather than print on it. SPEC:388-390 requires both stripped
 * before a page-derived string reaches a terminal. */
export const CONTROL_CHARACTERS =
  // eslint-disable-next-line no-control-regex -- the point is to match them
  /\u001B\[[0-9;]*[a-z]|[\u0000-\u001F\u007F-\u009F]/gi
