import { expect, test } from "bun:test"
import { mkdtemp, readdir, readFile, rm, stat } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { cacheRoot, extractPlugin, readPluginFiles } from "../src/plugin"

const source = path.resolve(import.meta.dirname, "../plugin")

test("embeds every plugin source file and declares the redsun plugin API", async () => {
  const files = await readPluginFiles(source)
  expect(Object.keys(files)).toEqual((await readdir(source)).filter((name) => /\.tsx?$/.test(name)).sort())
  expect(files["tui.tsx"]).toContain('id: "tacocode"')
  expect(files["tui.tsx"]).toContain("api: 1")
  expect(files["tui.tsx"]).toContain('replace: "home.logo"')
  expect(files["tui.tsx"]).toContain('append: "home.backdrop"')
  for (const text of Object.values(files)) expect(text).not.toMatch(/from "(?!\.\/|solid-js|@opentui\/solid)/)
})

test("extracts the plugin into a content-addressed cache directory once", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "tacocode-plugin-"))
  try {
    const files = await readPluginFiles(source)
    const directory = await extractPlugin(files, root)
    expect(path.dirname(directory)).toBe(path.join(root, "tacocode"))
    for (const [name, text] of Object.entries(files)) expect(await readFile(path.join(directory, name), "utf8")).toBe(text)
    const before = (await stat(path.join(directory, "tui.tsx"))).mtimeMs
    expect(await extractPlugin(files, root)).toBe(directory)
    expect((await stat(path.join(directory, "tui.tsx"))).mtimeMs).toBe(before)
    expect(await extractPlugin({ ...files, "tui.tsx": files["tui.tsx"] + "\n" }, root)).not.toBe(directory)
    expect(await readdir(root)).toEqual(["tacocode"])
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test("prefers XDG_CACHE_HOME for the extraction root", () => {
  expect(cacheRoot({ XDG_CACHE_HOME: "/cache" })).toBe("/cache")
  expect(cacheRoot({})).toBe(path.join(os.homedir(), ".cache"))
})
