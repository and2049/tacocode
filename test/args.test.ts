import { expect, test } from "bun:test"
import { argumentsFor } from "../src/args"
import { launchArguments } from "../src/redsun"

test("passes every argument through to redsun after the launch flags", () => {
  const input = argumentsFor(["C:/my project", "-c", "--session", "ses_example", "--prompt", "hello", "--yolo"])
  expect(input.help).toBe(false)
  expect(input.version).toBe(false)
  expect(launchArguments("C:/plugin", input.args)).toEqual([
    "--client",
    "tacocode",
    "--plugin",
    "C:/plugin",
    "C:/my project",
    "-c",
    "--session",
    "ses_example",
    "--prompt",
    "hello",
    "--yolo",
  ])
})

test("answers help and version locally only when they lead", () => {
  expect(argumentsFor(["--help"]).help).toBe(true)
  expect(argumentsFor(["-h"]).help).toBe(true)
  expect(argumentsFor(["--version"]).version).toBe(true)
  expect(argumentsFor(["-v"]).version).toBe(true)
  expect(argumentsFor(["--prompt", "--help"]).help).toBe(false)
  expect(argumentsFor([]).args).toEqual([])
})
