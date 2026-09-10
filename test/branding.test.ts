import { expect, test } from "bun:test"
import { withoutTheme } from "../src/config"
import { bell, logoSize, pixels, wordmark } from "../src/logo-art"
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
  expect(logoSize(120, 40)).toBe("bell")
  expect(logoSize(100, 27)).toBe("bell")
  expect(logoSize(100, 24)).toBe("wordmark")
  expect(logoSize(40, 20)).toBe("text")
  expect(logoSize(100, 9)).toBe("hidden")
  expect(new Set(wordmark.map((row) => row.length)).size).toBe(1)
  expect(new Set(bell.map((row) => row.length)).size).toBe(1)
  expect(pixels(bell)).toHaveLength(8)
  expect(pixels(wordmark)).toHaveLength(4)
  expect(pixels(["WP", "PW"])[0]).toEqual([
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
    if (name === "tui/src/component/dialog-config.tsx") expect(result).not.toContain('title: "Theme"')
    if (name === "tui/src/context/theme.tsx") {
      expect(result).not.toContain("config.theme")
      expect(result).not.toContain("draft.theme")
      expect(result).toContain("return theme === FALLBACK_THEME")
    }
  }
})
