export function argumentsFor(argv: readonly string[]) {
  const first = argv[0]
  return {
    help: first === "-h" || first === "--help",
    version: first === "-v" || first === "--version",
    args: [...argv],
  }
}

export const help = `Taco Code — redsun with the Taco Code look

Usage: tacocode [directory] [redsun options]

  -h, --help           Show this help
  -v, --version        Show the Taco Code version

Every other argument is passed to redsun unchanged; run redsun --help for the list.
Common ones: --continue, --session ID, --prompt TEXT, --server URL, --auto.

Requires redsun on PATH. REDSUN_BIN can select a specific executable.
Uses redsun configuration and sessions. The saved theme is ignored for this launch.
`
