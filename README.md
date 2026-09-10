# Taco Code

The redsun TUI with a fixed purple-and-white Taco Code theme and pixel-art bell logo. Taco Code is a redsun TUI plugin wrapped in a small `tacocode` launcher: the launcher runs your installed redsun with the plugin forced on for that launch, so sessions, tools, agents, models, integrations, configuration, layout, and updates all come from redsun itself. Plain `redsun` launches never see the plugin.

## Install

Install [redsun](https://github.com/and2049/redsun#install) first (v26-9-10.1 or newer, which carries TUI plugin API 1), then install Taco Code with one command:

**Linux / macOS / WSL:**

```sh
curl -fsSL https://github.com/and2049/tacocode/releases/latest/download/install | bash
```

**Windows (PowerShell):**

```powershell
irm https://github.com/and2049/tacocode/releases/latest/download/install.ps1 | iex
```

The installers download the latest release for x64 or arm64, verify its SHA-256 checksum, and add the install directory to PATH. Linux requires glibc. The destination is `~/.local/bin` on Linux/macOS or `~/.redsun/bin` on Windows; override it with an absolute `TACOCODE_INSTALL_DIR`. On Linux/macOS, open a new terminal or use the printed PATH command afterward.

To install a specific version or manage PATH yourself:

```sh
curl -fsSL https://github.com/and2049/tacocode/releases/latest/download/install | bash -s -- --version 0.2.0 --no-modify-path
```

```powershell
& ([scriptblock]::Create((irm https://github.com/and2049/tacocode/releases/latest/download/install.ps1))) -Version 0.2.0 -NoModifyPath
```

Re-run the installer to update Taco Code. Close Taco Code before updating on Windows. You can also extract an archive from [Releases](https://github.com/and2049/tacocode/releases) and put `tacocode` (`tacocode.exe` on Windows) on PATH manually.

## Run

```sh
tacocode
tacocode /path/to/project
tacocode --continue
tacocode --session ses_example
tacocode --server http://localhost:4096
```

`tacocode --help` and `tacocode --version` are answered locally. Every other argument is passed to redsun unchanged, so `redsun --help` lists the options. `REDSUN_BIN` can select a specific redsun executable.

The launcher runs `redsun --client tacocode --plugin <plugin directory> [your arguments]`. The plugin directory is embedded in the executable and unpacked once per version into `$XDG_CACHE_HOME/tacocode` (`~/.cache/tacocode` by default). Service discovery, reconnection, restart, and update notices are redsun's own.

## Configuration

Taco Code uses redsun's configuration, state, history, and plugin directories, including XDG overrides and `OPENCODE_CONFIG_DIR`. Terminal preferences are read from redsun's `cli.json`; project and server settings remain owned by redsun.

The plugin registers the `tacocode` and `tacocode-warm` themes, locks the theme for the launch, and selects `tacocode`. While locked, the theme switcher and the Theme settings row are hidden, and the theme saved in `cli.json` is neither used nor changed, so plain redsun keeps its own look. Every other preference is shared between the two frontends.

The icon and wordmark appear in standard-height terminals. The icon is the purple bell in vim insert mode and switches to the taco in normal and command mode, where the CODE half of the wordmark turns golden and the whole background shifts to a warm brown to match; short terminals use the wordmark, and narrow terminals use a compact text logo so the prompt remains usable. Behind the home screen, a faint purple crescent is drawn from half-block cells with the same technique as the logo, so it needs no image protocol support from the terminal.

## Build

Requires Bun 1.4.2. Runtime users do not need a source checkout or Bun.

```sh
git clone <this-repository>
cd tacocode
bun install --frozen-lockfile
bun test ./test
bun run build
bun run smoke
bun run install-local
```

`bun run dev` runs the launcher from source, reading the plugin directory from the checkout instead of the embedded copy. The integration smoke test requires installed redsun and uses temporary, isolated configuration and service directories. It checks cold startup, plugin extraction, the fixed and warm themes, multiple clients, the hidden theme switcher and settings row, resizing, and detaching, then stops its test service and removes the temporary data. Rendered frames are saved under `.cache/` for visual inspection.

The local installer copies into `~/.redsun/bin` on Windows or `~/.local/bin` on Linux/macOS. Override the destination with `TACOCODE_INSTALL_DIR`.

```sh
bun run build --target=bun-linux-x64
```

Release targets: Windows, Linux (glibc), and macOS on x64 and arm64. The release workflow builds each target on a matching runner, checks the executable, and produces archives with SHA-256 checksums.

## Plugin

`plugin/` is the redsun TUI plugin. `tui.tsx` is the entry: it registers both themes, locks and selects the theme, replaces the `home.logo` slot with the bell or taco logo, and appends the crescent to the `home.backdrop` slot. `look.ts`, `logo-art.ts`, `backdrop-art.ts`, and `theme.ts` are pure modules covered by unit tests; `logo.tsx` and `backdrop.tsx` render them. `redsun.ts` holds the subset of redsun's plugin API 1 the plugin uses, mirroring `packages/plugin/src/tui/context.ts` in redsun, whose `packages/plugin/src/tui/README.md` documents the full contract.

The plugin ships as source. Redsun's Bun build compiles `.tsx` plugin directories at load time and provides `solid-js` and `@opentui/solid`, so the plugin has no dependencies of its own; the `devDependencies` here exist only for type checking.

To run the plugin inside plain redsun during development, point redsun at the checkout:

```sh
redsun --client tacocode --plugin /path/to/tacocode/plugin
```

Adding the same path to the `plugins` array in redsun's `cli.json` loads it on every launch, with hot reload on save.

## Compatibility

Taco Code depends only on redsun's versioned TUI plugin API. Redsun's own test suite pins that contract with a skin fixture, and this repository's smoke test runs the launcher against the installed redsun. A redsun release that changes the API bumps its version; a plugin newer than the host fails setup with a message naming both versions and shows in `/plugins`.
