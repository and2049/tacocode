import { mkdir, copyFile, chmod } from "node:fs/promises"
import path from "node:path"
import os from "node:os"

const platform = process.platform === "win32" ? "windows" : process.platform
const executable = process.platform === "win32" ? "tacocode.exe" : "tacocode"
const source = path.resolve(import.meta.dirname, `../dist/tacocode-${platform}-${process.arch}/${executable}`)
if (!await Bun.file(source).exists()) throw new Error("Run bun run build first")
const directory = process.env.TACOCODE_INSTALL_DIR ?? (process.platform === "win32"
  ? path.join(os.homedir(), ".redsun", "bin")
  : path.join(os.homedir(), ".local", "bin"))
await mkdir(directory, { recursive: true })
const destination = path.join(directory, executable)
await copyFile(source, destination)
if (process.platform !== "win32") await chmod(destination, 0o755)
console.log(`Installed ${destination}\nEnsure ${directory} is on PATH.`)
