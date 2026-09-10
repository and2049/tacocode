import { palette } from "./theme"

export const bell = [
  "             sDDs             ",
  "             sDDs             ",
  "             sDDs             ",
  "      DPPPPPPPDDPPPPPPPD      ",
  "      DPPPPPPPDDPPPPPPPD      ",
  "      DPPPPPPPDDPPPPPPPD      ",
  "   PPPWWWWLLLLLSSSSSSsssPPP   ",
  "   PPPWWWWWWWWWSSSSSSsssPPP   ",
  "   PPPWWWWWWWWWWSSSSSsssPPP   ",
  " SPPsSWWWWWWWWWLLSSSSSSSSsPPS ",
  " SPPsSWWWWWWWWWWWWSSSSSSSsPPS ",
  " SPPsSWWWWWWWWWWWWSSSSSSSsPPS ",
  "DPPsSSWWWWWWWWWWWWLSSSSSSSsPPD",
  "DPPsSSWWWWWWWWWWWWWWSSSSSSsPPD",
  "DPPsSSWWWWWWWWWWWWWWSSSSSSsPPD",
  "PPPsSSWWWWWWWWWWWWWWLLSSSSsPPP",
  "PPPsSSWWWWWWWWWWWWWWWWLSSSsPPP",
  "PPPsSSLWWWWWWWWWWWWWWWWWSSsPPP",
  "PPPsSSSWWWWWWWWWWWWOOODWSSsPPP",
  "PPPsSSSWWWWWWWWWWWOOOsWWSSsPPP",
  "PPPsSSSWWWWWWWWOOOOsWWWWSSsPPP",
  "PPPsSSSSWWWWDOODWWWWWWWLSSsPPP",
  "PPPsSSSSWWWDOODWWWWWWWLSSSsPPP",
  "PPPsSSSSSWDOODWWWWWWLLSSSSsPPP",
  "PPPsSSSSWDOOWWWWWLSSSSSSSSsPPP",
  "PPPsSSSWWOOWWWWWLSSSSSSSSSsPPP",
  "PPPsSSSWWWWWWWLLSSSSSSSSSSsPPP",
  "PPPsSSSSSSSSSSSSSSSSSSSSSSsPPP",
  "PPPsSSSSSSSSSSSSSSSSSSSSSSsPPP",
  "PPPsSSSSSSSSSSSSSSSSSSSSSSsPPP",
  "PPPDDDDDDDDDDDDDDDDDDDDDDDDPPP",
  "PPPDDDDDDDDDDDDDDDDDDDDDDDDPPP",
  "PPPDDDDDDDDDDDDDDDDDDDDDDDDPPP",
  "                              ",
] as const

export const compactBell = [
  "      D       ",
  "   PPPDPPPP   ",
  "  PWWWWSSSSP  ",
  " PWWWWWSSSSSP ",
  " PWWWWWWSSSSP ",
  " PWWWWWWWSSSP ",
  " PSWWWWWWLSSP ",
  " PSSWWWWOOWSP ",
  " PSSWWOOOWWSP ",
  " PSSWOOOWWSSP ",
  " PSSWWWWLSSSP ",
  " PSSSSSSSSSSP ",
  " PDDDDDDDDDDP ",
  " PDDDDDDDDDDP ",
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
  D: "#8240BE",
  S: "#342047",
  s: "#24192F",
  W: palette.white,
  L: "#EEDFF8",
  O: palette.background,
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

export function logoSize(width: number, height: number): "full" | "compact" | "wordmark" | "text" | "hidden" {
  if (width < 8 || height < 10) return "hidden"
  if (width < wordmark[0]!.length || height < 20) return "text"
  return height >= 38 ? "full" : height >= 26 ? "compact" : "wordmark"
}
