import { palette } from "./theme"

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
    "        gh  ih        ",
    "        gjggii        ",
    "     ccklgcmnomp      ",
    "    qdirsgootujjvw    ",
    "   xyzAdBsnCDbvEFFG   ",
    "   HIJKsLsMvvFFbbFbD  ",
    "  HxFbencFFFFFbbbbebD ",
    " yqNFbujOvFbbbbbbbbPx ",
    "QHRSzuguEbbbbbbbbbPeTN",
    "UQfKVWXvbbPbbbbbbeeTTY",
    "ZyfRf0VbbeeeeeeeeeT12f",
    "ZyffWIeTeTTTTKKRKRrff ",
    "sQBW0GT1K1KYYSfffff   ",
    " lHwqKSffff           ",
    "   ffff               ",
  ],
  colors: {
    b: "#F8AE1A",
    c: "#42773A",
    d: "#A72517",
    e: "#EB8920",
    f: "#652E11",
    g: "#2C6131",
    h: "#9CC858",
    i: "#78AD54",
    j: "#679837",
    k: "#897C52",
    l: "#8A643C",
    m: "#86B869",
    n: "#5D9151",
    o: "#49903C",
    p: "#9DC06F",
    q: "#C68037",
    r: "#B73C27",
    s: "#7B5A26",
    t: "#5D5F2C",
    u: "#6F722C",
    v: "#F7DA3F",
    w: "#E4BC2F",
    x: "#B16629",
    y: "#B26B4A",
    z: "#8A6926",
    A: "#534C25",
    B: "#9D7D43",
    C: "#627717",
    D: "#C26F09",
    E: "#FCCD2F",
    F: "#F3CE12",
    G: "#D29612",
    H: "#E5A84A",
    I: "#AA6F19",
    J: "#909E37",
    K: "#BD591D",
    L: "#456027",
    M: "#BAA210",
    N: "#854C08",
    O: "#DEC647",
    P: "#F49B1F",
    Q: "#C99841",
    R: "#9B482C",
    S: "#783F18",
    T: "#DD7926",
    U: "#E5C05A",
    V: "#D9A62D",
    W: "#412011",
    X: "#907B35",
    Y: "#954D19",
    Z: "#CF8460",
    0: "#261A0D",
    1: "#D15C25",
    2: "#AC4A1E",
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

export function cell(top: string | undefined, bottom: string | undefined, base: string = palette.background): PixelCell {
  if (!top && !bottom) return { char: " ", fg: "transparent", bg: "transparent" }
  const fg = top ?? base
  const bg = bottom ?? base
  return { char: fg === bg ? " " : "▀", fg, bg }
}

export function pixels(art: PixelArt, base: string = palette.background): readonly (readonly PixelCell[])[] {
  const width = Math.max(0, ...art.rows.map((row) => row.length))
  const color = (y: number, x: number) => art.colors[art.rows[y]?.[x] ?? " "]
  return Array.from({ length: Math.ceil(art.rows.length / 2) }, (_, y) =>
    Array.from({ length: width }, (_, x) => cell(color(y * 2, x), color(y * 2 + 1, x), base)),
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

export function wordmarkWith(accent: string): PixelArt {
  return { ...wordmark, colors: { ...wordmark.colors, P: accent } }
}

export function logoSize(width: number, height: number): "icon" | "wordmark" | "text" | "hidden" {
  if (width < 8 || height < 10) return "hidden"
  if (width < wordmark.rows[0]!.length || height < 20) return "text"
  return height >= 26 ? "icon" : "wordmark"
}
