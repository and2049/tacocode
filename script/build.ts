import path from "node:path"
import { mkdir } from "node:fs/promises"
import { createSolidTransformPlugin } from "@opentui/solid/bun-plugin"
import { overlayPlugin } from "./overlays"

const root = path.resolve(import.meta.dirname, "..")
const args = process.argv.slice(2)
const target = args.find((arg) => arg.startsWith("--target="))?.slice(9)
  ?? `bun-${process.platform === "win32" ? "windows" : process.platform}-${process.arch}`
const supported = ["bun-windows-x64", "bun-windows-arm64", "bun-linux-x64", "bun-linux-arm64", "bun-darwin-x64", "bun-darwin-arm64"] as const
if (!supported.some((item) => item === target)) throw new Error(`Unsupported build target: ${target}`)
const output = path.join(root, "dist", target.replace("bun-", "tacocode-"), target.includes("windows") ? "tacocode.exe" : "tacocode")
await mkdir(path.dirname(output), { recursive: true })
const result = await Bun.build({
  entrypoints: [path.join(root, "src/index.ts")],
  tsconfig: path.join(root, "tsconfig.json"),
  plugins: [await overlayPlugin(), createSolidTransformPlugin()],
  format: "esm",
  minify: !args.includes("--debug"),
  sourcemap: args.includes("--debug") ? "inline" : "none",
  compile: {
    target: target as typeof supported[number],
    outfile: output,
    autoloadBunfig: false,
    autoloadDotenv: false,
    autoloadTsconfig: true,
    autoloadPackageJson: true,
    execArgv: ["--use-system-ca", "--no-warnings", "--"],
  },
  define: {
    OPENCODE_VERSION: JSON.stringify("tacocode"),
    OPENCODE_CHANNEL: JSON.stringify("latest"),
    OPENCODE_ARTIFACT: JSON.stringify("tacocode"),
    ...(target.includes("linux") ? { "process.env.OPENTUI_LIBC": JSON.stringify("glibc") } : {}),
  },
})
if (!result.success) throw new AggregateError(result.logs, "Taco Code build failed")
console.log(output)
if (args.includes("--run")) {
  const separator = args.indexOf("--")
  const child = Bun.spawn([output, ...(separator < 0 ? [] : args.slice(separator + 1))], { stdin: "inherit", stdout: "inherit", stderr: "inherit" })
  process.exit(await child.exited)
}
