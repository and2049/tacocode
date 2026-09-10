import path from "node:path"
import { argumentsFor, help } from "./args"
import { extractPlugin, readPluginFiles, type PluginFiles } from "./plugin"
import { executable, launchArguments } from "./redsun"
import pkg from "../package.json"

declare const TACOCODE_PLUGIN_FILES: PluginFiles | undefined

const input = argumentsFor(process.argv.slice(2))
if (input.help) console.log(help)
else if (input.version) console.log(pkg.version)
else {
  try {
    const redsun = executable()
    const files =
      typeof TACOCODE_PLUGIN_FILES === "undefined"
        ? await readPluginFiles(path.join(import.meta.dir, "../plugin"))
        : TACOCODE_PLUGIN_FILES
    const plugin = await extractPlugin(files)
    process.on("SIGINT", () => {})
    const child = Bun.spawn([redsun, ...launchArguments(plugin, input.args)], {
      stdio: ["inherit", "inherit", "inherit"],
    })
    process.exitCode = await child.exited
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
