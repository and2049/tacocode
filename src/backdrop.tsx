import { createMemo, createSignal } from "solid-js"
import { backdrop } from "./backdrop-art"
import { PixelRows } from "./logo"

export function Backdrop() {
  const [size, setSize] = createSignal({ width: 0, height: 0 })
  const rows = createMemo(() => backdrop(size().width, size().height))
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
