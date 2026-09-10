import { bell, taco, type PixelArt } from "./logo-art"
import type { VimMode } from "./redsun"
import { palette, warm } from "./theme"

export type Look = Readonly<{ theme: string; icon: PixelArt; accent: string; base: string; tints: readonly string[] }>

const bellLook: Look = {
  theme: "tacocode",
  icon: bell,
  accent: palette.purple,
  base: palette.background,
  tints: ["#15111C", "#191420", "#1C1725", "#1F1A29", "#231D2E"],
}

const tacoLook: Look = {
  theme: "tacocode-warm",
  icon: taco,
  accent: "#F2B33E",
  base: warm.background,
  tints: ["#1B1613", "#1F1A16", "#241E19", "#29221C", "#2E271F"],
}

export function look(mode: VimMode): Look {
  return mode === "insert" ? bellLook : tacoLook
}
