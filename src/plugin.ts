import { createHash } from "node:crypto"
import { mkdir, readdir, readFile, rename, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

export type PluginFiles = Readonly<Record<string, string>>

export async function readPluginFiles(directory: string): Promise<PluginFiles> {
  const names = (await readdir(directory)).filter((name) => /\.tsx?$/.test(name)).sort()
  const entries = await Promise.all(
    names.map(async (name) => [name, await readFile(path.join(directory, name), "utf8")] as const),
  )
  return Object.fromEntries(entries)
}

export function cacheRoot(env: Readonly<Record<string, string | undefined>> = process.env): string {
  return env.XDG_CACHE_HOME || path.join(os.homedir(), ".cache")
}

export async function extractPlugin(files: PluginFiles, root = cacheRoot()): Promise<string> {
  const hash = createHash("sha256").update(JSON.stringify(files)).digest("hex").slice(0, 16)
  const directory = path.join(root, "tacocode", `plugin-${hash}`)
  const entry = Bun.file(path.join(directory, "tui.tsx"))
  if (await entry.exists()) return directory
  const staging = `${directory}.${process.pid}`
  await mkdir(staging, { recursive: true })
  for (const [name, text] of Object.entries(files)) await writeFile(path.join(staging, name), text)
  await rename(staging, directory).catch(async (error: unknown) => {
    await rm(staging, { recursive: true, force: true })
    if (!(await entry.exists())) throw error
  })
  return directory
}
