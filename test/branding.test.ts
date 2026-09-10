import { expect, test } from "bun:test"
import { withoutTheme } from "../src/config"
import { bell, logoIcon, logoSize, pixels, runs, taco, wordmark } from "../src/logo-art"
import { backdrop, tint } from "../src/backdrop-art"
import { fixedTheme, palette } from "../src/theme"
import { colorToHex } from "@opencode/theme/tui"
import { overlays } from "../script/overlays"
import pkg from "../package.json"
import upstream from "../vendor/redsun/package.json"

test("uses redsun's exact dependency catalog and upstream patches", () => {
  expect(pkg.workspaces.catalog).toEqual(upstream.workspaces.catalog)
  expect<Record<string, string>>(pkg.patchedDependencies).toEqual(Object.fromEntries(
    Object.entries(upstream.patchedDependencies).map(([name, file]) => [name, `vendor/redsun/${file}`]),
  ))
})

test("ignores even a malformed theme without losing other preferences", () => {
  const original = { theme: 123, plugins: ["example"], scroll: { speed: 3 } }
  expect(withoutTheme(original)).toEqual({ plugins: ["example"], scroll: { speed: 3 } })
  expect(original.theme).toBe(123)
})

test("resolves the fixed dark palette and meaningful feedback colors", () => {
  expect(colorToHex(fixedTheme.background.default).toLowerCase()).toBe(palette.background.toLowerCase())
  expect(colorToHex(fixedTheme.text.default).toLowerCase()).toBe(palette.white.toLowerCase())
  expect(fixedTheme.text.feedback.error.default).not.toEqual(fixedTheme.text.feedback.success.default)
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

test("every overlay applies to the pinned redsun source", async () => {
  for (const [name, transform] of Object.entries(overlays)) {
    const text = (await Bun.file(`vendor/redsun/packages/${name}`).text()).replaceAll("\r\n", "\n")
    const result = transform(text)
    expect(result).not.toBe(text)
    if (name === "tui/src/app.tsx") {
      expect(result).not.toContain('name: "theme.switch"')
      expect(result).not.toContain("DialogThemeList")
      expect(result).toContain('renderer.setTerminalTitle("tacocode")')
      expect(result).toContain('name: "permission.mode"')
    }
    if (name === "tui/src/routes/home.tsx") expect(result).toContain("<Backdrop />\n      <box")
    if (name === "tui/src/component/dialog-config.tsx") expect(result).not.toContain('title: "Theme"')
    if (name === "tui/src/context/theme.tsx") {
      expect(result).not.toContain("config.theme")
      expect(result).not.toContain("draft.theme")
      expect(result).toContain("return theme === FALLBACK_THEME")
    }
  }
})

test("shows the bell while typing and the taco in vim normal and command modes", () => {
  expect(logoIcon("insert")).toBe(bell)
  expect(logoIcon("normal")).toBe(taco)
  expect(logoIcon("command")).toBe(taco)
})

test("blank pixel cells stay transparent and runs merge identical neighbours", () => {
  const blank = { char: " ", fg: "transparent", bg: "transparent" }
  expect(pixels({ rows: [" W", "  "], colors: wordmark.colors })[0]).toEqual([blank, { char: "▀", fg: palette.white, bg: palette.background }])
  expect(runs([blank, blank, { char: "▀", fg: "#000000", bg: "#FFFFFF" }, { char: "▀", fg: "#000000", bg: "#FFFFFF" }, blank])).toEqual([
    { text: "  ", fg: "transparent", bg: "transparent" },
    { text: "▀▀", fg: "#000000", bg: "#FFFFFF" },
    { text: " ", fg: "transparent", bg: "transparent" },
  ])
})

test("backdrop wave is deterministic, subtle, and leaves most of the screen untouched", () => {
  const rows = backdrop(120, 40)
  expect(rows).toHaveLength(40)
  expect(rows[0]).toHaveLength(120)
  expect(backdrop(120, 40)).toEqual(rows)
  const painted = rows.flat().filter((cell) => cell.bg !== "transparent").length
  expect(painted).toBeGreaterThan(120 * 40 * 0.1)
  expect(painted).toBeLessThan(120 * 40 * 0.5)
  expect(tint(0, 0, 120, 80)).toBeUndefined()
  expect(backdrop(0, 0)).toEqual([])
})
