import { For, Show, createMemo } from "solid-js"
import { logoSize, pixels, runs, wordmarkWith, type PixelCell } from "./logo-art"
import { look } from "./look"
import type { Context } from "./redsun"
import { palette } from "./theme"

export function PixelRows(props: { rows: readonly (readonly PixelCell[])[] }) {
  return (
    <box flexDirection="column" flexShrink={0}>
      <For each={props.rows}>
        {(row) => (
          <text selectable={false} height={1}>
            <For each={runs(row)}>{(run) => <span style={{ fg: run.fg, bg: run.bg }}>{run.text}</span>}</For>
          </text>
        )}
      </For>
    </box>
  )
}

export function Logo(props: { context: Context }) {
  const dimensions = props.context.ui.dimensions
  const size = createMemo(() => logoSize(dimensions().width, dimensions().height))
  const current = createMemo(() => look(props.context.vim.mode))
  const icon = createMemo(() => pixels(current().icon, current().base))
  const word = createMemo(() => pixels(wordmarkWith(current().accent), current().base))
  return (
    <Show when={size() !== "hidden"}>
      <box alignItems="center" flexShrink={0}>
        <Show when={size() === "icon"}>
          <PixelRows rows={icon()} />
          <box height={1} />
        </Show>
        <Show
          when={size() !== "text"}
          fallback={
            <text selectable={false}>
              <span style={{ fg: palette.white }}>TACO</span>
              <span style={{ fg: current().accent }}>CODE</span>
            </text>
          }
        >
          <PixelRows rows={word()} />
        </Show>
      </box>
    </Show>
  )
}
