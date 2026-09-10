import path from "node:path"
import { mkdir, copyFile } from "node:fs/promises"
import { createHash } from "node:crypto"

const target = process.argv[2]
if (!target || !/^(windows|linux|darwin)-(x64|arm64)$/.test(target)) throw new Error("Expected a release platform and architecture")
const directory = path.resolve(import.meta.dirname, `../dist/tacocode-${target}`)
const binary = path.join(directory, target.startsWith("windows") ? "tacocode.exe" : "tacocode")
const smoke = Bun.spawn([binary, "--version"], { stdout: "inherit", stderr: "inherit" })
if (await smoke.exited !== 0) throw new Error("Executable smoke test failed")
await copyFile(path.resolve(import.meta.dirname, "../README.md"), path.join(directory, "README.md"))
await copyFile(path.resolve(import.meta.dirname, "../LICENSE"), path.join(directory, "LICENSE"))
const release = path.resolve(import.meta.dirname, "../dist/release")
await mkdir(release, { recursive: true })
const archive = path.join(release, `tacocode-${target}.tar.gz`)
const tar = Bun.spawn(["tar", "-czf", archive, "-C", directory, "."], { stdout: "inherit", stderr: "inherit" })
if (await tar.exited !== 0) throw new Error("Release archive failed")
const hash = createHash("sha256").update(await Bun.file(archive).bytes()).digest("hex")
await Bun.write(`${archive}.sha256`, `${hash}  ${path.basename(archive)}\n`)
