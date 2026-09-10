import { createEffect, createMemo, createSignal, onCleanup } from "solid-js"
import { useVim } from "../vendor/redsun/packages/tui/src/context/vim"
import { useThemes } from "../vendor/redsun/packages/tui/src/context/theme"
import { backdrop } from "./backdrop-art"
import { look } from "./look"
import { PixelRows } from "./logo"

export function Backdrop() {
  const vim = useVim()
  const themes = useThemes()
  const [size, setSize] = createSignal({ width: 0, height: 0 })
  const current = createMemo(() => look(vim.mode))
  const rows = createMemo(() => backdrop(size().width, size().height, current()))
  createEffect(() => themes.set(current().theme))
  onCleanup(() => themes.set(look("insert").theme))
  return (
    <box
      position="absolute"
      zIndex={-1}
      left={0}
      top={0}
      right={0}
      bottom={0}
      onSizeChange={function () {
        setSize({ width: this.width, height: this.height })
      }}
    >
      <PixelRows rows={rows()} />
    </box>
  )
}
