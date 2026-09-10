import "reflect-metadata"
import { argumentsFor, help } from "./args"
import pkg from "../package.json"

try {
  const input = argumentsFor(process.argv.slice(2))
  if (input.help) console.log(help)
  else if (input.version) console.log(pkg.version)
  else if ((!process.stdin.isTTY || !process.stdout.isTTY) && !(process.env.OPENCODE_DRIVE && process.env.OPENCODE_DRIVE_RENDERER === "headless")) {
    console.error("tacocode requires an interactive terminal")
    process.exitCode = 1
  } else {
    process.stderr.write("Loading Taco Code...\n")
    const { main } = await import("./main")
    main(input)
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
