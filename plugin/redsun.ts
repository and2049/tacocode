import type { JSX } from "@opentui/solid"

export type VimMode = "insert" | "normal" | "command"

export type Size = Readonly<{ width: number; height: number }>

export type SlotClaim =
  | Readonly<{ replace: "home.logo"; render: () => JSX.Element }>
  | Readonly<{ append: "home.backdrop"; render: (input: Size) => JSX.Element }>

export type McpServerConfig = Readonly<{
  type: "local"
  command: readonly string[]
  cwd?: string
  environment?: Readonly<Record<string, string>>
}>

export type Location = Readonly<{ directory: string; workspaceID?: string }>

export type McpAddInput = Readonly<{
  server: string
  location?: Readonly<{ directory?: string; workspace?: string }>
  config: McpServerConfig
}>

export type Context = Readonly<{
  app: Readonly<{ name: string; version: string; channel: string }>
  location: Location | undefined
  client: Readonly<{ mcp: Readonly<{ add(input: McpAddInput): Promise<void> }> }>
  vim: Readonly<{ mode: VimMode }>
  themes: Readonly<{
    register(name: string, document: unknown): () => void
    select(name: string): boolean
    lock(): () => void
    current(): string
  }>
  ui: Readonly<{
    dimensions(): Size
    slot(claim: SlotClaim): () => void
    toast: Readonly<{ show(options: ToastOptions): void }>
  }>
}>

export type ToastOptions = Readonly<{ title?: string; message: string; variant?: "info" | "success" | "warning" | "error" }>

export type Cleanup = () => void | Promise<void>

export type Definition = Readonly<{ id: string; api: number; setup(context: Context): Cleanup | void }>
