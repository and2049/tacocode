import { palette } from "./theme"

export const bell = [
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
] as const

const letters: Record<string, readonly string[]> = {
  T: ["11111", "11111", "01110", "01110", "01110", "01110", "01110"],
  A: ["01110", "11011", "11011", "11011", "11111", "11011", "11011"],
  C: ["01111", "11111", "11000", "11000", "11000", "11111", "01111"],
  O: ["01110", "11011", "11011", "11011", "11011", "11011", "01110"],
  D: ["11110", "11111", "11011", "11011", "11011", "11111", "11110"],
  E: ["11111", "11111", "11000", "11110", "11000", "11111", "11111"],
}

export const wordmark = Array.from({ length: 7 }, (_, row) =>
  Array.from("TACOCODE", (letter, index) =>
    letters[letter]![row]!.replaceAll("1", index < 4 ? "W" : "P").replaceAll("0", " "),
  ).join(" "),
)

const colors: Record<string, string> = {
  " ": palette.background,
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
}

export type PixelCell = Readonly<{ char: string; fg: string; bg: string }>

export function pixels(rows: readonly string[]): readonly (readonly PixelCell[])[] {
  const width = Math.max(0, ...rows.map((row) => row.length))
  return Array.from({ length: Math.ceil(rows.length / 2) }, (_, y) =>
    Array.from({ length: width }, (_, x) => {
      const top = colors[rows[y * 2]?.[x] ?? " "] ?? palette.background
      const bottom = colors[rows[y * 2 + 1]?.[x] ?? " "] ?? palette.background
      return { char: top === bottom ? " " : "▀", fg: top, bg: bottom }
    }),
  )
}

export function logoSize(width: number, height: number): "bell" | "wordmark" | "text" | "hidden" {
  if (width < 8 || height < 10) return "hidden"
  if (width < wordmark[0]!.length || height < 20) return "text"
  return height >= 26 ? "bell" : "wordmark"
}
