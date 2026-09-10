import type { JSX } from "@opentui/solid"

export type VimMode = "insert" | "normal" | "command"

export type Size = Readonly<{ width: number; height: number }>

export type SlotClaim =
  | Readonly<{ replace: "home.logo"; render: () => JSX.Element }>
  | Readonly<{ append: "home.backdrop"; render: (input: Size) => JSX.Element }>

export type Context = Readonly<{
  app: Readonly<{ name: string; version: string; channel: string }>
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
  }>
}>

export type Definition = Readonly<{ id: string; api: number; setup(context: Context): void }>
