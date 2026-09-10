import path from "node:path"

export function executable(env: Readonly<Record<string, string | undefined>> = process.env): string {
  const binary = Bun.which(env.REDSUN_BIN ?? "redsun")
  if (!binary)
    throw new Error("redsun is required. Install redsun and add it to PATH, or set REDSUN_BIN to its executable.")
  if (path.resolve(binary).toLowerCase() === path.resolve(process.execPath).toLowerCase())
    throw new Error("REDSUN_BIN must point to redsun, not tacocode")
  return binary
}

export function launchArguments(plugin: string, args: readonly string[]): string[] {
  return ["--client", "tacocode", "--plugin", plugin, ...args]
}
