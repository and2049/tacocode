import { For, Show, createMemo } from "solid-js"
import { useTerminalDimensions } from "@opentui/solid"
import { bell, logoSize, pixels, wordmark, type PixelCell } from "./logo-art"
import { palette } from "./theme"

function PixelArt(props: { rows: readonly (readonly PixelCell[])[] }) {
  return (
    <box flexDirection="column" flexShrink={0}>
      <For each={props.rows}>
        {(row) => (
          <text selectable={false} height={1}>
            <For each={row}>{(cell) => <span style={{ fg: cell.fg, bg: cell.bg }}>{cell.char}</span>}</For>
          </text>
        )}
      </For>
    </box>
  )
}

const icon = pixels(bell)
const word = pixels(wordmark)

export function Logo() {
  const dimensions = useTerminalDimensions()
  const size = createMemo(() => logoSize(dimensions().width, dimensions().height))
  return (
    <Show when={size() !== "hidden"}>
      <box alignItems="center" flexShrink={0}>
        <Show when={size() === "bell"}>
          <PixelArt rows={icon} />
          <box height={1} />
        </Show>
        <Show when={size() !== "text"} fallback={
          <text selectable={false}><span style={{ fg: palette.white }}>TACO</span><span style={{ fg: palette.purple }}>CODE</span></text>
        }>
          <PixelArt rows={word} />
        </Show>
      </box>
    </Show>
  )
}
