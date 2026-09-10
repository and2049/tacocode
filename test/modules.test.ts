import { expect, test } from "bun:test"
import path from "node:path"
import { createSolidTransformPlugin } from "@opentui/solid/bun-plugin"
import { overlayPlugin } from "../script/overlays"

test("absolute and relative imports share TUI contexts and the locked theme", async () => {
  const runtime = path.resolve("vendor/redsun/packages/tui/src/context/runtime.tsx").replaceAll("\\", "/")
  const theme = path.resolve("vendor/redsun/packages/tui/src/context/theme.tsx").replaceAll("\\", "/")
  const input = path.resolve(".cache/module-probe.ts")
  const output = path.resolve(".cache/module-probe.mjs")
  await Bun.write(input, `
import assert from "node:assert/strict"
import { TuiPathsProvider as absolute } from ${JSON.stringify(runtime)}
import { TuiPathsProvider as relative } from "../vendor/redsun/packages/tui/src/context/runtime"
import { allThemes as absoluteThemes } from ${JSON.stringify(theme)}
import { allThemes as packageThemes } from "@opencode/tui/context/theme"
assert.equal(absolute, relative)
assert.equal(absoluteThemes, packageThemes)
assert.deepEqual(Object.keys(packageThemes()), ["tacocode"])
`)
  const build = await Bun.build({
    entrypoints: [input], target: "bun",
    plugins: [await overlayPlugin(), createSolidTransformPlugin()],
    external: ["@opentui/core", "@opentui/core/*", "@opentui/solid", "solid-js", "solid-js/*"],
    outdir: path.dirname(output), naming: path.basename(output),
  })
  expect(build.success).toBe(true)
  const child = Bun.spawn([process.execPath, output], { stdout: "pipe", stderr: "pipe" })
  const error = await new Response(child.stderr).text()
  expect(await child.exited, error).toBe(0)
}, 30_000)
