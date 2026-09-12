import { expect, test } from "bun:test"
import { createSignal } from "solid-js"
import { connectServers, doordash, serversFor } from "../plugin/mcp"
import type { Context, Location } from "../plugin/redsun"

function fake(add: Context["client"]["mcp"]["add"]) {
  const [location, setLocation] = createSignal<Location | undefined>(undefined)
  const toasts: string[] = []
  const context = {
    get location() {
      return location()
    },
    client: { mcp: { add } },
    ui: { toast: { show: (options: { title?: string }) => toasts.push(options.title ?? "") } },
  } as unknown as Context
  return { context, setLocation, toasts }
}

test("ships doordash-mcp over stdio on Windows only", () => {
  expect(doordash.command).toEqual(["npx", "-y", "doordash-mcp@0.1.3", "serve"])
  expect(serversFor("win32")).toEqual({ doordash })
  expect(serversFor("linux")).toEqual({})
})

test("registers each server once per location as soon as the location is known", async () => {
  const calls: unknown[] = []
  const { context, setLocation } = fake(async (input) => void calls.push(input))
  const dispose = connectServers(context, { doordash })
  expect(calls).toEqual([])
  setLocation({ directory: "C:/one", workspaceID: "ws" })
  setLocation({ directory: "C:/one", workspaceID: "ws" })
  setLocation({ directory: "C:/two" })
  await Bun.sleep(0)
  expect(calls).toEqual([
    { server: "doordash", location: { directory: "C:/one", workspace: "ws" }, config: doordash },
    { server: "doordash", location: { directory: "C:/two", workspace: undefined }, config: doordash },
  ])
  dispose()
  setLocation({ directory: "C:/three" })
  expect(calls).toHaveLength(2)
})

test("reports a failed registration and retries on the next location change", async () => {
  let attempts = 0
  const { context, setLocation, toasts } = fake(async () => {
    if (++attempts === 1) throw new Error("no endpoint")
  })
  connectServers(context, { doordash })
  setLocation({ directory: "C:/one" })
  await Bun.sleep(0)
  expect(toasts).toEqual(["doordash MCP not connected"])
  setLocation({ directory: "C:/one" })
  await Bun.sleep(0)
  expect(attempts).toBe(2)
})
