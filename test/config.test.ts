import { expect, test } from "bun:test"
import { mkdir, mkdtemp, rm } from "node:fs/promises"
import path from "node:path"
import os from "node:os"
import { createSolidTransformPlugin } from "@opentui/solid/bun-plugin"
import { overlayPlugin } from "../script/overlays"

test("shared config updates preserve native themes, including during migration", async () => {
  const output = path.resolve(".cache/config-probe.mjs")
  const build = await Bun.build({
    entrypoints: [path.resolve("test/fixtures/config-probe.ts")],
    target: "bun",
    external: ["@opentui/core", "@opentui/core/*", "solid-js", "solid-js/*"],
    plugins: [await overlayPlugin(), createSolidTransformPlugin()],
    outdir: path.dirname(output),
    naming: path.basename(output),
  })
  expect(build.success).toBe(true)
  const parent = path.join(os.tmpdir(), "redsun")
  await mkdir(parent, { recursive: true })
  const directory = await mkdtemp(path.join(parent, "tacocode-config-"))
  try {
    const config = path.join(directory, "config", "redsun")
    await mkdir(config, { recursive: true })
    for (const [theme, legacy] of [[{ name: "dusk", mode: "light" }, false], [123, false], [{ name: "custom" }, true]] as const) {
      await Bun.write(path.join(config, "cli.json"), JSON.stringify({
        theme,
        scroll: { speed: 2 },
        terminal: legacy ? { copy_on_select: true } : { copy: "manual" },
        customFutureSetting: "keep me",
      }))
      const child = Bun.spawn([process.execPath, output, JSON.stringify(theme)], {
        env: { ...process.env, XDG_CONFIG_HOME: path.join(directory, "config"), XDG_STATE_HOME: path.join(directory, "state") },
        stdout: "pipe", stderr: "pipe",
      })
      const error = await new Response(child.stderr).text()
      expect(await child.exited, error).toBe(0)
      const saved = await Bun.file(path.join(config, "cli.json")).text()
      if (legacy) expect(saved).not.toContain("copy_on_select")
    }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}, 30_000)
