import { palette } from "./theme"
import type { VimMode } from "../vendor/redsun/packages/tui/src/vim"

export type PixelArt = Readonly<{ rows: readonly string[]; colors: Readonly<Record<string, string>> }>

export const bell: PixelArt = {
  rows: [
    "   sPPPPPs   ",
    " sPPPPPPPPPs ",
    "sPLLLGMMMMPPs",
    "PllLLLWGMKGMP",
    "PlWWWLWWLLWGP",
    "PlWWWWWLL WKP",
    "PGWWWWL  kWSP",
    "PgWWWL kkWWSP",
    "PSGWL  kWWSSP",
    "PSSLL  WWGSSP",
    "PSKL kWWSSSSP",
    "PSGLWWWGSSSSP",
    "PSSGKSSSSSSSP",
    "dDDDDDDDDDDDd",
    "EeDDDDDDDDDeE",
  ],
  colors: {
    P: palette.purple,
    W: palette.white,
    L: "#ECDCF7",
    l: "#F1E8F1",
    S: "#342047",
    s: "#2F1B43",
    M: "#3B2056",
    G: "#665671",
    g: "#58456A",
    K: "#AD9CBA",
    k: "#434045",
    D: "#7B3CB4",
    d: "#8C40C6",
    E: "#7436A6",
    e: "#683399",
  },
}

export const taco: PixelArt = {
  rows: [
    "        cf  gf          ",
    "        cgccgf          ",
    "     cchhccfccff        ",
    "    idgdjccccjcklb      ",
    "   iijedhegjmblbbbi     ",
    "   nigmjcjollbbbbbbi    ",
    "  nibbbccbbbbbbbbbbbi   ",
    " iiebbhcllbbbbbbbbbbi   ",
    "indejjcjbbbbbbbbbbbbij  ",
    "liembehlbbbbbbbbbbbiid  ",
    "ipeje bbbbbbbbbbbiiide  ",
    "ihee mbiiiiiiimdmdmee   ",
    "jih  biiiimdddeeeee     ",
    " jibimdeeee             ",
    "   eeee                 ",
  ],
  colors: {
    b: "#F8AE1A",
    c: "#42773A",
    d: "#A72517",
    e: "#652E11",
    f: "#9CC858",
    g: "#78AD54",
    h: "#897C52",
    i: "#C68037",
    j: "#7B5A26",
    k: "#6C8A2E",
    l: "#F7DA3F",
    m: "#C26F09",
    n: "#E5A84A",
    o: "#BAA210",
    p: "#A85F41",
  },
}

const letters: Record<string, readonly string[]> = {
  T: ["11111", "11111", "01110", "01110", "01110", "01110", "01110"],
  A: ["01110", "11011", "11011", "11011", "11111", "11011", "11011"],
  C: ["01111", "11111", "11000", "11000", "11000", "11111", "01111"],
  O: ["01110", "11011", "11011", "11011", "11011", "11011", "01110"],
  D: ["11110", "11111", "11011", "11011", "11011", "11111", "11110"],
  E: ["11111", "11111", "11000", "11110", "11000", "11111", "11111"],
}

export const wordmark: PixelArt = {
  rows: Array.from({ length: 7 }, (_, row) =>
    Array.from("TACOCODE", (letter, index) =>
      letters[letter]![row]!.replaceAll("1", index < 4 ? "W" : "P").replaceAll("0", " "),
    ).join(" "),
  ),
  colors: { P: palette.purple, W: palette.white },
}

export type PixelCell = Readonly<{ char: string; fg: string; bg: string }>
export type PixelRun = Readonly<{ text: string; fg: string; bg: string }>

export function cell(top: string | undefined, bottom: string | undefined): PixelCell {
  if (!top && !bottom) return { char: " ", fg: "transparent", bg: "transparent" }
  const fg = top ?? palette.background
  const bg = bottom ?? palette.background
  return { char: fg === bg ? " " : "▀", fg, bg }
}

export function pixels(art: PixelArt): readonly (readonly PixelCell[])[] {
  const width = Math.max(0, ...art.rows.map((row) => row.length))
  const color = (y: number, x: number) => art.colors[art.rows[y]?.[x] ?? " "]
  return Array.from({ length: Math.ceil(art.rows.length / 2) }, (_, y) =>
    Array.from({ length: width }, (_, x) => cell(color(y * 2, x), color(y * 2 + 1, x))),
  )
}

export function runs(row: readonly PixelCell[]): readonly PixelRun[] {
  const result: PixelRun[] = []
  for (const { char, fg, bg } of row) {
    const last = result.at(-1)
    if (last && last.fg === fg && last.bg === bg && last.text[0] === char) result[result.length - 1] = { ...last, text: last.text + char }
    else result.push({ text: char, fg, bg })
  }
  return result
}

export function logoIcon(mode: VimMode): PixelArt {
  return mode === "insert" ? bell : taco
}

export function logoSize(width: number, height: number): "icon" | "wordmark" | "text" | "hidden" {
  if (width < 8 || height < 10) return "hidden"
  if (width < wordmark.rows[0]!.length || height < 20) return "text"
  return height >= 26 ? "icon" : "wordmark"
}
