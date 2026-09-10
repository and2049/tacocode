import { expect, test } from "bun:test"
import { bell, logoSize, pixels, runs, taco, wordmark, wordmarkWith } from "../plugin/logo-art"
import { backdrop, tint } from "../plugin/backdrop-art"
import { look } from "../plugin/look"
import { palette, tacoTheme, warm, warmTheme } from "../plugin/theme"

test("theme documents are dark, flat v1 palettes built on the Taco Code colours", () => {
  expect(tacoTheme.mode).toBe("dark")
  expect(tacoTheme.theme.background).toBe(palette.background)
  expect(tacoTheme.theme.text).toBe(palette.white)
  expect(tacoTheme.theme.error).not.toBe(tacoTheme.theme.success)
  expect(warmTheme.theme.background).toBe(warm.background)
  expect(warmTheme.theme.text).toBe(palette.white)
})

test("logo scales down before it consumes the prompt area", () => {
  expect(logoSize(120, 40)).toBe("icon")
  expect(logoSize(100, 27)).toBe("icon")
  expect(logoSize(100, 24)).toBe("wordmark")
  expect(logoSize(40, 20)).toBe("text")
  expect(logoSize(100, 9)).toBe("hidden")
  for (const art of [wordmark, bell, taco]) expect(new Set(art.rows.map((row) => row.length)).size).toBe(1)
  expect(pixels(bell)).toHaveLength(8)
  expect(pixels(taco)).toHaveLength(8)
  expect(pixels(wordmark)).toHaveLength(4)
  expect(pixels({ rows: ["WP", "PW"], colors: wordmark.colors })[0]).toEqual([
    { char: "▀", fg: palette.white, bg: palette.purple },
    { char: "▀", fg: palette.purple, bg: palette.white },
  ])
})

test("shows the bell while typing and the warm taco look in vim normal and command modes", () => {
  expect(look("insert")).toMatchObject({ icon: bell, accent: palette.purple, base: palette.background, theme: "tacocode" })
  expect(look("normal")).toMatchObject({ icon: taco, accent: "#F2B33E", base: warm.background, theme: "tacocode-warm" })
  expect(look("command")).toBe(look("normal"))
  expect(look("normal").tints).not.toEqual(look("insert").tints)
  expect(wordmarkWith("#F2B33E").colors.P).toBe("#F2B33E")
  expect(wordmarkWith("#F2B33E").rows).toBe(wordmark.rows)
  expect(pixels({ rows: ["W", " "], colors: wordmark.colors }, warm.background)[0]).toEqual([
    { char: "▀", fg: palette.white, bg: warm.background },
  ])
})

test("blank pixel cells stay transparent and runs merge identical neighbours", () => {
  const blank = { char: " ", fg: "transparent", bg: "transparent" }
  expect(pixels({ rows: [" W", "  "], colors: wordmark.colors })[0]).toEqual([
    blank,
    { char: "▀", fg: palette.white, bg: palette.background },
  ])
  expect(
    runs([
      blank,
      blank,
      { char: "▀", fg: "#000000", bg: "#FFFFFF" },
      { char: "▀", fg: "#000000", bg: "#FFFFFF" },
      blank,
    ]),
  ).toEqual([
    { text: "  ", fg: "transparent", bg: "transparent" },
    { text: "▀▀", fg: "#000000", bg: "#FFFFFF" },
    { text: " ", fg: "transparent", bg: "transparent" },
  ])
})

test("backdrop wave is deterministic, subtle, and leaves most of the screen untouched", () => {
  const rows = backdrop(120, 40, look("insert"))
  expect(rows).toHaveLength(40)
  expect(rows[0]).toHaveLength(120)
  expect(backdrop(120, 40, look("insert"))).toEqual(rows)
  const painted = rows.flat().filter((cell) => cell.bg !== "transparent").length
  expect(painted).toBeGreaterThan(120 * 40 * 0.1)
  expect(painted).toBeLessThan(120 * 40 * 0.5)
  expect(tint(0, 0, 120, 80, look("insert").tints)).toBeUndefined()
  expect(backdrop(0, 0, look("insert"))).toEqual([])
  const warmRows = backdrop(120, 40, look("normal"))
  expect(warmRows.flat().filter((cell) => cell.bg !== "transparent").length).toBe(painted)
  expect(warmRows.flat().map((cell) => cell.bg)).not.toEqual(rows.flat().map((cell) => cell.bg))
})
