import type { UpdateSource } from "../vendor/redsun/packages/tui/src/context/update-notification"
import { command } from "./backend"
import { action } from "../vendor/redsun/packages/cli/src/services/updater-action"

export function updater(binary: string, remote: boolean): UpdateSource {
  return {
    remote,
    subscribe: () => Promise.resolve(),
    async check(signal) {
      const response = await fetch("https://api.github.com/repos/and2049/redsun/releases/latest", {
        headers: { "User-Agent": "tacocode" },
        signal: AbortSignal.any([signal, AbortSignal.timeout(10_000)]),
      })
      if (!response.ok) throw new Error(`redsun update check failed (${response.status})`)
      const release: unknown = await response.json()
      if (!release || typeof release !== "object" || !("tag_name" in release) || typeof release.tag_name !== "string")
        throw new Error("redsun release information did not contain a version")
      const version = release.tag_name.replace(/^v/, "")
      const installed = (await command(binary, ["--version"], signal)).replace(/^v/, "")
      return action(installed, version, "notify") === "none" ? undefined : { type: "available", version }
    },
    apply: (version) => command(binary, ["upgrade", version]).then(() => undefined),
  }
}
