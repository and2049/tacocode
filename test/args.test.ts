import { expect, test } from "bun:test"
import { argumentsFor, serverURL } from "../src/args"

test("preserves TUI session options and a directory containing spaces", () => {
  const input = argumentsFor(["C:/my project", "-c", "--session", "ses_example", "--agent", "plan", "--prompt", "hello", "--yolo"])
  expect(input.directory).toBe("C:/my project")
  expect(input.args).toMatchObject({ continue: true, sessionID: "ses_example", agent: "plan", prompt: "hello", auto: true })
})

test("does not grant auto approval by default", () => {
  expect(argumentsFor([]).args.auto).toBeFalsy()
})

test("rejects invalid arguments and credential-bearing server URLs", () => {
  expect(() => argumentsFor(["one", "two"])).toThrow("Usage")
  expect(() => argumentsFor(["--theme", "dusk"])).toThrow()
  expect(() => argumentsFor(["--session"])).toThrow()
  expect(() => serverURL("file:///server")).toThrow()
  expect(() => serverURL("https://user:password@example.com")).toThrow()
  expect(serverURL("http://127.0.0.1:1234/\n")).toBe("http://127.0.0.1:1234")
})
