import { createEffect, createMemo, onCleanup } from "solid-js"
import { backdrop } from "./backdrop-art"
import { look } from "./look"
import { PixelRows } from "./logo"
import type { Context } from "./redsun"

export function Backdrop(props: { context: Context; width: number; height: number }) {
  const current = createMemo(() => look(props.context.vim.mode))
  const rows = createMemo(() => backdrop(props.width, props.height, current()))
  createEffect(() => props.context.themes.select(current().theme))
  onCleanup(() => props.context.themes.select(look("insert").theme))
  return <PixelRows rows={rows()} />
}
