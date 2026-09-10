import { parseArgs } from "node:util"

export function argumentsFor(argv: string[]) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    strict: true,
    options: {
      help: { type: "boolean", short: "h" },
      version: { type: "boolean", short: "v" },
      server: { type: "string" },
      continue: { type: "boolean", short: "c" },
      session: { type: "string", short: "s" },
      prompt: { type: "string" },
      model: { type: "string", short: "m" },
      agent: { type: "string" },
      fork: { type: "boolean" },
      auto: { type: "boolean" },
      yolo: { type: "boolean" },
      "dangerously-skip-permissions": { type: "boolean" },
    },
  })
  if (positionals.length > 1) throw new Error("Usage: tacocode [directory] [options]")
  if (values.server) serverURL(values.server)
  return {
    help: values.help,
    version: values.version,
    directory: positionals[0],
    server: values.server,
    args: {
      continue: values.continue,
      sessionID: values.session,
      prompt: values.prompt,
      model: values.model,
      agent: values.agent,
      fork: values.fork,
      auto: values.auto || values.yolo || values["dangerously-skip-permissions"],
    },
  }
}

export function serverURL(value: string): string {
  const url = URL.parse(value.trim())
  if (!url || !["http:", "https:"].includes(url.protocol) || url.username || url.password)
    throw new Error("Expected a redsun HTTP(S) server URL without embedded credentials")
  return url.href.replace(/\/$/, "")
}

export const help = `Taco Code — the redsun TUI with a fixed Taco Code theme

Usage: tacocode [directory] [options]

  -c, --continue        Continue the last session
  -s, --session ID      Resume a session
      --prompt TEXT    Start with a prompt
  -m, --model MODEL    Select a model
      --agent AGENT    Select an agent
      --fork           Fork the resumed session
      --auto           Auto-approve permissions (also --yolo)
      --server URL     Connect to an explicit redsun server
  -h, --help           Show this help
  -v, --version        Show the Taco Code version

Requires redsun on PATH. REDSUN_BIN can select a specific executable.
Uses redsun configuration and sessions. The saved theme is ignored.
Without --server, discovers or starts redsun's shared background service.
`
