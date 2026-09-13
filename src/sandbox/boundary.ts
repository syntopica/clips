export type Boundary = (command: string[]) => {
  argv: string[]
  env: Record<string, string>
}
