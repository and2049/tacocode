import { execFile } from "node:child_process"
import { readdir } from "node:fs/promises"
import path from "node:path"
import { Effect } from "effect"
import { Service, type Endpoint } from "@opencode/client/effect/service"
import { OpenCode } from "@opencode/client"
import { Global } from "@opencode/util/global"
import { serverURL } from "./args"

export function executable(): string {
  const binary = Bun.which(process.env.REDSUN_BIN ?? "redsun")
  if (!binary) throw new Error("redsun is required. Install redsun and add it to PATH, or set REDSUN_BIN to its executable.")
  if (path.resolve(binary).toLowerCase() === path.resolve(process.execPath).toLowerCase())
    throw new Error("REDSUN_BIN must point to redsun, not tacocode")
  return binary
}

export function command(binary: string, args: readonly string[], signal?: AbortSignal): Promise<string> {
  const { OPENCODE_DRIVE: _drive, OPENCODE_DRIVE_RENDERER: _renderer, ...env } = process.env
  return new Promise((resolve, reject) => {
    execFile(binary, [...args], { encoding: "utf8", windowsHide: true, timeout: 120_000, maxBuffer: 1024 * 1024, signal, env }, (error, stdout, stderr) => {
      if (error) return reject(new Error(`redsun ${args.join(" ")} failed: ${stderr.trim() || error.message}`))
      resolve(stdout.trim())
    })
  })
}

export const connect = Effect.fn("tacocode.connect")(function* (binary: string, remote?: string) {
  const global = yield* Global.Service
  const managed = Effect.fn("tacocode.service")(function* () {
    const output = yield* Effect.tryPromise((signal) => command(binary, ["service", "start"], signal))
    const url = yield* Effect.try(() => serverURL(output))
    const names = yield* Effect.tryPromise(() => readdir(global.state))
    for (const name of names.filter((name) => /^service(?:-[\w.-]+)?\.json$/.test(name))) {
      const file = path.join(global.state, name)
      const endpoint = yield* Service.discover({ file })
      if (endpoint && serverURL(endpoint.url) === url) return { endpoint, file, registration: `${file}.remote` }
    }
    return yield* Effect.fail(new Error("redsun started, but its authenticated service registration could not be found"))
  })
  const local = remote ? undefined : yield* managed()
  const password = process.env.OPENCODE_PASSWORD ?? process.env.OPENCODE_SERVER_PASSWORD
  const endpoint: Endpoint = local?.endpoint ?? {
    url: serverURL(remote!),
    auth: password ? { type: "basic", username: "opencode", password } : undefined,
  }
  const api = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) })
  const health = yield* Effect.tryPromise({
    try: (signal) => api.health.get({ signal: AbortSignal.any([signal, AbortSignal.timeout(10_000)]) }),
    catch: () => new Error("Could not authenticate with a compatible redsun V2 server. Check redsun and the server password."),
  })
  return {
    endpoint,
    version: health.version,
    service: local ? {
      registration: local.registration,
      reconnect: () => managed().pipe(Effect.map((value) => value.endpoint)),
      restart: () => Effect.gen(function* () {
        yield* Service.stop({ file: local.file, pty: "handoff" })
        yield* managed()
      }),
    } : undefined,
  }
})
