/** Renders roots as the SBPL `(subpath "...")` clauses of one allow rule. */
export const seatbeltSubpaths = (roots: string[]): string =>
  roots.map((root) => `(subpath "${root}")`).join(' ')
