export const splitNul = (output: string): string[] =>
  output.split('\u0000').filter(Boolean)
