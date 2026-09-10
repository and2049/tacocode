import path from "node:path"
import { mkdir } from "node:fs/promises"
import type { BunPlugin } from "bun"

const root = path.resolve(import.meta.dirname, "..")
const source = (name: string) => JSON.stringify(path.join(root, "src", name).replaceAll("\\", "/"))

function replace(text: string, before: string, after: string): string {
  if (!text.includes(before)) throw new Error(`redsun overlay no longer matches: ${before.slice(0, 100)}`)
  return text.replaceAll(before, after)
}

export const overlays: Readonly<Record<string, (text: string) => string>> = {
  "tui/src/component/logo.tsx": () => `export { Logo } from ${source("logo.tsx")}`,
  "tui/src/routes/home.tsx": (text) => {
    text = replace(text, '    <>\n      <box width="100%" flexShrink={0}>', '    <>\n      <Backdrop />\n      <box width="100%" flexShrink={0}>')
    return `import { Backdrop } from ${source("backdrop.tsx")}\n${text}`
  },
  "tui/src/theme/index.ts": (text) => {
    text = replace(text, "return { ...DEFAULT_THEMES, ...pluginThemes, ...customThemes }", 'return { tacocode: tacoTheme, "tacocode-warm": warmTheme }')
    return `import { tacoTheme, warmTheme } from ${source("theme.ts")}\n${text}`
  },
  "tui/src/context/theme.tsx": (text) => {
    text = replace(text, 'const FALLBACK_THEME = "dusk"', 'const FALLBACK_THEME = "tacocode"')
    text = replace(text, "const active = config.theme?.name ?? FALLBACK_THEME", "const active = FALLBACK_THEME")
    text = replace(text, "const theme = config.theme?.name", "const theme = FALLBACK_THEME")
    text = replace(text, "return discoverThemes(configDirectories(config, process.cwd()))", "return {}")
    return replace(text, `        if (!hasTheme(theme)) return false
        setStore("active", theme)
        void configState
          .update((draft) => {
            draft.theme = { ...draft.theme, name: theme }
          })
          .catch(() => {})
        return true`, `        if (!hasTheme(theme)) return false
        setStore("active", theme)
        return true`)
  },
  "tui/src/app.tsx": (text) => {
    text = replace(text, "fallback={(error, reset) => (", 'fallback={(error, reset) => (log("error", "Taco Code render failed", { error }),')
    text = replace(text, 'import { DialogThemeList } from "./component/dialog-theme-list"\n', "")
    text = replace(text, '  "theme.switch",\n', "")
    text = replace(text, `      {
        name: "theme.switch",
        title: "Switch theme",
        slash: { name: "themes" },
        run: () => {
          dialog.replace(() => <DialogThemeList />)
        },
        category: "System",
      },
`, "")
    text = replace(text, 'renderer.setTerminalTitle("redsun")', 'renderer.setTerminalTitle("tacocode")')
    return replace(text, "renderer.setTerminalTitle(`redsun |", "renderer.setTerminalTitle(`tacocode |")
  },
  "tui/src/component/dialog-config.tsx": (text) => replace(text, `  {
    title: "Theme",
    category: "Appearance",
    path: ["theme", "name"],
    default: "opencode",
    keywords: ["color scheme", "colors"],
  },
`, ""),
  "cli/src/config/config.ts": (text) => {
    text = replace(text, "const decode = Schema.decodeUnknownOption(Info)", "const decode = (value: unknown) => Schema.decodeUnknownOption(Info)(withoutTheme(value))")
    text = replace(text, "if (migration?.info) return migration.info", "if (migration?.info) return Option.getOrElse(decode(migration.info), () => empty)")
    text = replace(text, "const current = migration?.info ?? Option.getOrElse(decode(yield* readJson()), () => empty)", "const current = Option.getOrElse(decode(migration?.info ?? (yield* readJson())), () => empty)")
    text = replace(text, "const next = produce(current, update)", "const next = produce(current, (draft) => { update(draft); delete draft.theme })")
    return `import { withoutTheme } from ${source("config.ts")}\n${text}`
  },
}

export async function overlayPlugin(): Promise<BunPlugin> {
  const files = new Map<string, string>()
  for (const [name, transform] of Object.entries(overlays)) {
    const original = path.join(root, "vendor/redsun/packages", name)
    const output = path.join(root, ".cache/overlays", name)
    const text = transform((await Bun.file(original).text()).replaceAll("\r\n", "\n"))
      .replace(/(from\s+|import\s*\(\s*|import\s+)(["'])(\.[^"']+)\2/g, (_, prefix: string, _quote: string, spec: string) =>
        prefix + JSON.stringify(path.resolve(path.dirname(original), spec).replaceAll("\\", "/")),
      )
    await mkdir(path.dirname(output), { recursive: true })
    await Bun.write(output, text)
    files.set(original, output)
  }
  return {
    name: "tacocode-overlays",
    setup(build) {
      build.onResolve({ filter: /^(?:\.|[A-Za-z]:|\/|@opencode\/tui)/ }, (args) => {
        let resolved: string
        try {
          resolved = path.normalize(Bun.resolveSync(args.path, args.resolveDir))
        } catch {
          return undefined
        }
        const file = files.get(resolved)
        return file ? { path: file } : resolved.startsWith(path.join(root, "vendor")) ? { path: resolved } : undefined
      })
    },
  }
}
