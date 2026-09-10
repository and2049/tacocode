import assert from "node:assert/strict"
import { mkdir, mkdtemp, rm, readdir } from "node:fs/promises"
import { createServer } from "node:net"
import os from "node:os"
import path from "node:path"

const root = path.resolve(import.meta.dirname, "..")
const binary = path.join(root, "dist", `tacocode-${process.platform === "win32" ? "windows" : process.platform}-${process.arch}`, process.platform === "win32" ? "tacocode.exe" : "tacocode")
const redsun = Bun.which(process.env.REDSUN_BIN ?? "redsun")
assert.ok(redsun, "Install redsun before running the integration smoke test")

async function port(): Promise<number> {
  const server = createServer()
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
  const address = server.address()
  assert.ok(address && typeof address === "object")
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  return address.port
}

const parent = path.join(os.tmpdir(), "redsun")
await mkdir(parent, { recursive: true })
const directory = await mkdtemp(path.join(parent, "tacocode-smoke-"))
const config = path.join(directory, "config/redsun")
await mkdir(config, { recursive: true })
await Bun.write(path.join(config, "redsun.json"), JSON.stringify({ update: "disable" }))
await Bun.write(path.join(config, "cli.json"), JSON.stringify({ theme: { name: "dusk" }, animations: false, attention: { enabled: false }, scroll: { speed: 2 } }))
const env = {
  ...process.env,
  XDG_CONFIG_HOME: path.join(directory, "config"),
  XDG_DATA_HOME: path.join(directory, "data"),
  XDG_CACHE_HOME: path.join(directory, "cache"),
  XDG_STATE_HOME: path.join(directory, "state"),
  OPENCODE_CONFIG_DIR: config,
  OPENCODE_TEST_HOME: directory,
  DRIVE_REGISTRY_DIR: directory,
}

async function backend(...args: string[]): Promise<string> {
  const child = Bun.spawn([redsun!, ...args], { env, cwd: directory, stdout: "pipe", stderr: "pipe" })
  const text = await new Response(child.stdout).text()
  const error = await new Response(child.stderr).text()
  assert.equal(await child.exited, 0, error)
  return text.trim()
}

type Frame = { cols: number; rows: number; lines: { spans: { text: string; fg: number[]; bg: number[] }[] }[] }
const clients: { process: ReturnType<typeof Bun.spawn>; socket: WebSocket }[] = []

async function launch(name: string) {
  const endpoint = `ws://127.0.0.1:${await port()}`
  await Bun.write(path.join(directory, `${name}.json`), JSON.stringify({ endpoints: { ui: endpoint, backend: `ws://127.0.0.1:${await port()}` }, viewport: { cols: 110, rows: 40 } }))
  const child = Bun.spawn([binary], {
    env: { ...env, OPENCODE_DRIVE: name, OPENCODE_DRIVE_RENDERER: "headless" },
    cwd: directory,
    stdout: "pipe", stderr: "pipe",
  })
  let output = ""
  const read = async (stream: ReadableStream<Uint8Array>) => {
    const reader = stream.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const chunk = await reader.read()
      if (chunk.done) break
      output += decoder.decode(chunk.value, { stream: true })
    }
  }
  void read(child.stdout)
  void read(child.stderr)
  const deadline = Date.now() + 60_000
  let socket: WebSocket | undefined
  while (Date.now() < deadline && child.exitCode === null) {
    socket = await new Promise<WebSocket | undefined>((resolve) => {
      const ws = new WebSocket(endpoint)
      ws.onopen = () => resolve(ws)
      ws.onerror = () => { ws.close(); resolve(undefined) }
    })
    if (socket) break
    await Bun.sleep(200)
  }
  if (!socket) {
    child.kill()
    await child.exited
    throw new Error(`TUI did not start: ${output}`)
  }
  clients.push({ process: child, socket })
  let id = 0
  async function rpc<T>(method: string, params = {}): Promise<T> {
    const current = ++id
    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => { socket!.removeEventListener("message", receive); reject(new Error(`${method} timed out\n${output}`)) }, 15_000)
      function receive(event: MessageEvent) {
        const message = JSON.parse(String(event.data)) as { id: number; result: T; error?: unknown }
        if (message.id !== current) return
        clearTimeout(timeout)
        socket!.removeEventListener("message", receive)
        if (message.error) reject(new Error(JSON.stringify(message.error)))
        else resolve(message.result)
      }
      socket!.addEventListener("message", receive)
      socket!.send(JSON.stringify({ jsonrpc: "2.0", id: current, method, params }))
    })
  }
  const capture = () => rpc<Frame>("ui.capture")
  const text = (frame: Frame) => frame.lines.map((line) => line.spans.map((span) => span.text).join("")).join("\n")
  async function waitFor(expected: string) {
    const deadline = Date.now() + 30_000
    let frame = await capture()
    while (!text(frame).includes(expected) && Date.now() < deadline) {
      await Bun.sleep(100)
      frame = await capture()
    }
    assert.ok(text(frame).includes(expected), `Missing ${expected}:\n${text(frame)}\n${output}`)
    return frame
  }
  return { child, socket, rpc, capture, waitFor, text }
}

try {
  await backend("service", "set", "port", String(await port()))
  assert.equal(await backend("service", "status"), "stopped")
  const first = await launch("first")
  const frame = await first.waitFor("Ask anything")
  assert.ok(first.text(frame).includes((await backend("--version")).split(/\s+/).pop()!.replace(/^v/, "")), `home footer should show the redsun version:
${first.text(frame)}`)
  const state = path.join(env.XDG_STATE_HOME, "redsun")
  const registrationName = (await readdir(state)).find((name) => /^service(?:-[\w.-]+)?\.json$/.test(name))
  assert.ok(registrationName)
  const registrationFile = path.join(state, registrationName)
  const registration = await Bun.file(registrationFile).json() as { id: string; pid: number }
  assert.ok(registration.pid > 0)
  await mkdir(path.join(root, ".cache"), { recursive: true })
  await Bun.write(path.join(root, ".cache/home-frame.json"), JSON.stringify(frame))
  console.log(first.text(frame))
  const second = await launch("second")
  await second.waitFor("Ask anything")
  const reused = await Bun.file(registrationFile).json() as { id: string; pid: number }
  assert.equal(reused.id, registration.id)
  assert.equal(reused.pid, registration.pid)
  await first.rpc("ui.press", { key: "p", modifiers: { ctrl: true } })
  const commands = await first.waitFor("Commands")
  assert.ok(!first.text(commands).includes("Switch theme"))
  await first.rpc("ui.press", { key: "ESCAPE" })
  await first.rpc("ui.type", { text: "/settings" })
  await first.rpc("ui.enter")
  const settings = await first.waitFor("Animations")
  assert.ok(!first.text(settings).includes("Theme"))
  await first.rpc("ui.press", { key: "ESCAPE" })
  await first.rpc("ui.type", { text: "/restart" })
  await first.rpc("ui.enter")
  await first.waitFor("Service restarted")
  await second.waitFor("Ask anything")
  const restarted = await Bun.file(registrationFile).json() as { id: string; pid: number }
  assert.notEqual(restarted.id, registration.id)
  await first.rpc("ui.resize", { cols: 100, rows: 27 })
  const compact = await first.waitFor("Ask anything")
  await Bun.write(path.join(root, ".cache/compact-frame.json"), JSON.stringify(compact))
  await first.rpc("ui.resize", { cols: 40, rows: 20 })
  await first.waitFor("TACOCODE")
  await first.rpc("ui.press", { key: "d", modifiers: { ctrl: true } })
  await Promise.race([first.child.exited, Bun.sleep(10_000).then(() => { throw new Error("TUI did not exit") })])
  assert.equal(first.child.exitCode, 0)
  assert.notEqual(await backend("service", "status"), "stopped")
  const saved = await Bun.file(path.join(config, "cli.json")).json() as { theme: { name: string } }
  assert.equal(saved.theme.name, "dusk")
  console.log("PASS: cold start, shared service, command palette, settings, restart/reconnect, resizing, detach, native theme preservation")
} catch (error) {
  console.error(error)
  throw error
} finally {
  const logDirectory = path.join(directory, "data/redsun/log")
  for (const file of await readdir(logDirectory).catch(() => [] as string[])) {
    if (file.endsWith(".log")) await Bun.write(path.join(root, ".cache", `smoke-${file}`), Bun.file(path.join(logDirectory, file)))
  }
  for (const client of clients) {
    client.socket.close()
    if (client.process.exitCode === null) client.process.kill()
  }
  await backend("service", "stop")
  await Promise.all(clients.map((client) => client.process.exited))
  clients.length = 0
  Bun.gc(true)
  await rm(directory, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 })
}
