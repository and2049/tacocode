import { createEffect, createRoot } from "solid-js"
import type { Context, McpServerConfig } from "./redsun"

export const doordash: McpServerConfig = { type: "local", command: ["npx", "-y", "doordash-mcp", "serve"] }

export function serversFor(platform: string): Readonly<Record<string, McpServerConfig>> {
  return platform === "win32" ? { doordash } : {}
}

export function connectServers(context: Context, servers = serversFor(process.platform)): () => void {
  const done = new Set<string>()
  return createRoot((dispose) => {
    createEffect(() => {
      const location = context.location
      if (!location || done.has(location.directory)) return
      done.add(location.directory)
      for (const [server, config] of Object.entries(servers))
        void context.client.mcp
          .add({ server, location: { directory: location.directory, workspace: location.workspaceID }, config })
          .catch((error: unknown) => {
            done.delete(location.directory)
            context.ui.toast.show({
              variant: "error",
              title: `${server} MCP not connected`,
              message: error instanceof Error ? error.message : String(error),
            })
          })
    })
    return dispose
  })
}
