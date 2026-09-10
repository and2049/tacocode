import assert from "node:assert/strict"
import { NodeServices } from "@effect/platform-node"
import { Effect } from "effect"
import { Global } from "@opencode/util/global"
import { Config } from "../../vendor/redsun/packages/cli/src/config"
import { parse } from "jsonc-parser"

await Effect.runPromise(Effect.gen(function* () {
  const config = yield* Config.Service
  const initial = yield* config.get()
  assert.equal(initial.theme, undefined)
  assert.equal(initial.scroll?.speed, 2)
  const result = yield* config.update((draft) => {
    draft.scroll = { ...draft.scroll, speed: 5 }
    draft.theme = { name: "tacocode" }
  })
  assert.equal(result.theme, undefined)
  assert.equal(result.scroll?.speed, 5)
  const persisted: unknown = parse(yield* Effect.tryPromise(() => Bun.file(config.path).text()))
  assert.ok(persisted && typeof persisted === "object")
  assert.ok("theme" in persisted)
  assert.deepEqual(persisted.theme, JSON.parse(process.argv[2]!))
  assert.ok("customFutureSetting" in persisted)
  assert.equal(persisted.customFutureSetting, "keep me")
}).pipe(
  Effect.provide(Config.layer),
  Effect.provideService(Global.Service, Global.make()),
  Effect.provide(NodeServices.layer),
  Effect.scoped,
))
