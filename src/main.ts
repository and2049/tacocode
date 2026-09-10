import { NodeRuntime, NodeServices } from "@effect/platform-node"
import { Cause, Effect, FileSystem } from "effect"
import { run } from "@opencode/tui"
import { LayerNode } from "@opencode/util/effect/layer-node"
import { Global } from "@opencode/util/global"
import { Npm } from "@opencode/util/npm"
import { AppProcess } from "@opencode/util/process"
import { Observability } from "@opencode/util/observability"
import { Config } from "../vendor/redsun/packages/cli/src/config"
import { Env } from "../vendor/redsun/packages/cli/src/env"
import { connect, executable } from "./backend"
import { updater } from "./updater"
import type { argumentsFor } from "./args"
import pkg from "../package.json"

export function main(input: ReturnType<typeof argumentsFor>) {
  Effect.gen(function* () {
    const binary = yield* Effect.try(executable)
    if (input.directory) yield* Effect.try(() => process.chdir(input.directory!))
    process.stderr.write("Connecting to redsun...\n")
    const server = yield* connect(binary, input.server)
    const config = yield* Config.Service
    const npm = yield* Npm.Service
    const context = yield* Effect.context<FileSystem.FileSystem>()
    const runPromise = Effect.runPromiseWith(context)
    const runFork = Effect.runForkWith(context)
    const service = server.service
    yield* run({
      app: { name: "tacocode", version: pkg.version, channel: "latest" },
      server: {
        endpoint: server.endpoint,
        service: service ? {
          registration: service.registration,
          reconnect: (signal) => runPromise(service.reconnect(), { signal }),
          restart: () => runPromise(service.restart()),
        } : undefined,
      },
      args: input.args,
      config: {
        path: config.path,
        get: () => runPromise(config.get()),
        update: (update) => runPromise(config.update(update)),
      },
      packages: { prepare: (spec, install = true) => runPromise(install ? npm.add(spec) : npm.resolve(spec)) },
      environment: input.server ? undefined : Env.session(),
      updater: updater(binary, input.server !== undefined),
      log: (level, message, tags) => {
        const log = level === "debug" ? Effect.logDebug : level === "warn" ? Effect.logWarning : level === "error" ? Effect.logError : Effect.logInfo
        runFork(log(message, tags))
      },
    })
  }).pipe(
    Effect.provide(Config.layer),
    Effect.provide(LayerNode.compile(LayerNode.group([Global.node, AppProcess.node, Npm.node]))),
    Effect.provide(NodeServices.layer),
    Effect.annotateLogs({ role: "cli", client: "tacocode" }),
    Effect.provide(Observability.layer({ client: "tacocode", version: pkg.version, channel: "latest" })),
    Effect.scoped,
    Effect.catchCause((cause) => Effect.sync(() => {
      console.error(Cause.pretty(cause))
      process.exitCode = 1
    })),
    Effect.tap(() => Effect.sync(() => process.exit(process.exitCode ?? 0))),
    NodeRuntime.runMain,
  )
}
