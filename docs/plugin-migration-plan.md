# Taco Code on the redsun plugin layer

Status: complete. Phase 1 shipped in redsun v26-9-10.1 (plugin API 1). Phase 2 landed in this repository on 2026-09-10 on branch `feature/plugin-wrapper`: `plugin/` is the redsun TUI plugin, `src/` is the launcher, and the vendored submodule and overlays are gone. See "Phase 1 outcome" and "Phase 2 outcome" for where the implementation deviates from the plan below.

## Goal

Taco Code stops bundling a vendored copy of redsun's TUI. It becomes two small things:

1. A redsun TUI plugin package that owns every Taco Code visual: fixed theme, bell and taco logos, mode-aware wordmark, backdrop crescent, warm theme in normal and command mode.
2. A thin launcher executable named `tacocode` that runs the user's installed redsun with that plugin forced on for this launch only.

Plain `redsun` launches never see the plugin. Redsun TUI updates, layout changes, and backend protocol changes arrive the moment the user updates redsun, because redsun's own binary renders everything. The only contract Taco Code depends on is the plugin API described below, which redsun versions and tests.

## What exists today in redsun

Verified against the live checkout on 2026-09-10.

| Area | Current state | File |
| --- | --- | --- |
| Plugin entry | Default export `{ id, setup(context) }` via `Plugin.define`, resolved from `<package>/tui` or `<dir>/tui` | `packages/plugin/src/host.ts`, `packages/tui/src/plugin/context.tsx` |
| Plugin sources | Config dir and project `plugins/` folders, server plugins with `features.tui`, and `cli.json` `plugins` entries (npm spec, local path, enable and disable directives) | `packages/tui/src/plugin/context.tsx:246-340` |
| Slots | `app`, `home.footer`, `prompt.footer`, `prompt.footer.status`, `prompt.footer.file`, `session.composer.top`, `sidebar.content`, `sidebar.footer`; claims use exactly one of prepend, append, before, after, replace | `packages/plugin/src/tui/context.ts:176-245` |
| Context surface | options, location, app version and channel, renderer, client, data store, attention, theme tokens, markdown renderers, keymap, storage, dialogs, toast, router | `packages/tui/src/plugin/api.tsx:109-199` |
| Not exposed | vim mode, terminal dimensions, config, theme registration and selection, app name, i18n | same |
| Home route | `home.footer` slot on top, then a hardcoded `Logo`, update notice, hint line, prompt. No logo hook, nothing renders beneath content | `packages/tui/src/routes/home.tsx:88-128` |
| Themes | Module registry with `addTheme` and `upsertTheme`, never handed to plugins. `themes.set` always persists to `cli.json`. No lock or hide mechanism | `packages/tui/src/theme/index.ts`, `packages/tui/src/context/theme.tsx:205-214` |
| Branding | Terminal title is the literal string `redsun` in three places. `app.name` reaches only the debug dialog | `packages/tui/src/app.tsx:559-585` |
| Launch | Root command is the TUI. Identity comes from `OPENCODE_CLIENT` and `OPENCODE_TUI_CHANNEL`. `TuiInput` has no `plugins` field, so a launcher cannot add a plugin without editing the user's `cli.json` | `packages/cli/src/commands/handlers/default.ts:60-65`, `packages/tui/src/app.tsx:162-186` |

## What Taco Code patches today, and where each one goes

| Current overlay or code | Replacement |
| --- | --- |
| `logo.tsx` whole-file replacement | Plugin claims `replace: "home.logo"` |
| `home.tsx` backdrop injection | Plugin claims `append: "home.backdrop"` |
| Theme registry overlay adding `tacocode` and `tacocode-warm` | `context.theme.register(name, document)` in plugin setup |
| Theme context overlay locking the theme and skipping persistence | `context.theme.lock()` plus `context.theme.select(name)` |
| `app.tsx` overlay removing the theme switch command and retitling the terminal | Lock hides the command; title reads `app.name` |
| `dialog-config.tsx` overlay removing the Theme row | Lock hides the row |
| `cli/config.ts` overlay stripping `theme` from `cli.json` writes | Unnecessary once plugin selection never persists |
| `src/look.ts`, `logo-art.ts`, `backdrop-art.ts`, `theme.ts` | Move into the plugin unchanged; they are already pure |
| `src/logo.tsx`, `backdrop.tsx` | Move into the plugin; swap `useVim` and `useThemes` for `context.vim` and `context.theme` |
| `backend.ts`, `updater.ts`, `main.ts` | Deleted. Redsun's own CLI resolves the service and handles updates |
| `args.ts` | Kept only as pass-through to redsun |
| `vendor/redsun` submodule, `script/overlays.ts` | Deleted |

## Phase 1: redsun changes

Each item is one small pull request with its own tests. Order matters only where noted.

### 1.1 Branding reads `app.name`

- Terminal title uses `app.name` instead of the literal `redsun` in all three places in `app.tsx`.
- `context.app.name` is forwarded to plugins in `plugin/api.tsx`.
- Test: the existing title effect test, if any, plus a unit test that the title matches the app name.

### 1.2 Launch-scoped plugins and identity

- `TuiInput.plugins?: PluginDirective[]` using the same entry type as `cli.json`. Entries are appended after config plugins in `plugin/context.tsx` and are never written back to config.
- Root CLI command gains `--plugin <spec>` (repeatable) and `--client <name>`. `--client` sets `app.name`, the observability client tag, and nothing else. `OPENCODE_CLIENT` keeps working as the env fallback.
- Plugins given this way follow the same resolution as config entries, so local directories and npm specs both work. The Bun runtime's JSX transform applies to local directories exactly as it does for `plugins/` folders.
- Test: a drive-harness test launches with `--plugin ./fixtures/skin` and asserts the fixture's slot content appears, and that `cli.json` is byte-identical afterwards.

### 1.3 New home slots

- `home.logo`: wraps the current logo. The default logo moves into a builtin plugin `opencode.home.logo` that claims `append`, following the `home.footer` pattern, so an external plugin's `replace` takes the whole boundary.
- `home.backdrop`: a new absolute box in `home.tsx` with `left`, `top`, `right`, `bottom` at zero and `zIndex` of minus one, containing the slot. Content renders under everything on the home route. Input carries `{ width, height }` of the box so a plugin can size a grid without measuring.
- Both paths are added to `SlotMap` in `packages/plugin/src/tui/context.ts`.
- Test: structure tests for the two new paths, and a render test that a `replace` claim on `home.logo` removes the builtin logo.

### 1.4 Context additions

- `context.vim.mode`: reactive getter returning `insert`, `normal`, or `command`, backed by `useVim`.
- `context.ui.dimensions()`: reactive `{ width, height }` from `useTerminalDimensions`.
- `context.theme.register(name, document)`: calls `upsertTheme`, returns a disposer that removes the theme. Setup-time registration is disposed on deactivate.
- `context.theme.select(name)`: sets the active theme without persisting to `cli.json`. Depends on 1.5.
- `context.theme.current`: reactive name of the active theme.
- Test: unit tests through a plugin fixture that reads each field and asserts values change when the vim mode, terminal size, and selection change.

### 1.5 Theme lock

- `context.theme.lock()`: for the rest of the process, the active theme ignores `config.theme.name`, the `theme.switch` command is disabled and hidden from the palette and slash list, the Theme row is filtered out of the settings dialog, and `themes.set` from the switcher path becomes a no-op. Plugin selection through `select` still works.
- Implementation is a single `locked` signal in `context/theme.tsx` read by the command's `enabled` predicate, by `dialog-config.tsx`, and by `set`.
- `select` and `lock` never touch `cli.json`, so the user's saved theme for plain redsun launches survives untouched. This retires Taco Code's config stripping.
- Test: with lock on, the palette has no theme switch entry, the settings dialog has no Theme row, `select` changes the rendered background, and `cli.json` is unchanged.

### 1.6 Plugin API version and contract tests

- `Plugin.define` accepts an optional `api` number. The host records its supported version. A plugin declaring a newer version than the host supports fails setup with a toast that names both numbers instead of crashing later.
- A `skin` fixture plugin lives in redsun's test tree and exercises every hook above: both new slots, vim mode, dimensions, theme register, select, and lock, and `app.name`. Redsun CI runs it through the drive harness. This is the guard that keeps the contract honest across refactors.
- A short authoring page in the plugin docs lists the hooks with their input types and the lock semantics.

## Phase 1 outcome

Implemented as planned except for these points, which the plugin in Phase 2 must follow. Authoring reference: `packages/plugin/src/tui/README.md` in redsun; contract guard: `packages/tui/test/skin-plugin.test.tsx` with the fixture in `packages/tui/test/fixture/skin`.

| Plan | Implementation |
| --- | --- |
| `context.theme.register/select/lock/current` | `context.themes.register(name, document)`, `select(name)`, `lock()`, `current()`, `locked()`. `context.theme` stays the resolved token object |
| `lock()` for the rest of the process | `lock()` returns a release function; locks are refcounted and released on plugin deactivation |
| Default logo moves into a builtin `opencode.home.logo` plugin | `<Logo />` stays as the `home.logo` slot's children; a `replace` claim still takes the whole boundary |
| Toast naming both API numbers | Setup fails with an error naming both numbers; it shows through the standard "Plugin failed" toast and in `/plugins` |
| `Plugin.define({ api })` | `Plugin.API` is `1`; `api` is optional and only checked when newer than the host |
| `--client` sets the observability tag | Done through a pre-parse scan of `process.argv` in the CLI entry, since the telemetry layer is built before the root command parses |

Open questions 1 and 2 are settled: the distributed redsun binary is the Bun build and compiles `.tsx` plugin directories at load time, aliasing `@opencode/plugin/tui`, `@opentui/solid`, `@opentui/core`, `solid-js` and `solid-js/store` to the host's copies, so the plugin ships as source with no dependencies; and setup runs before the first home paint (the first captured frame already shows the skin). Question 3 is untouched, and question 4 remains as described.

Verified with the full redsun TUI suite, the CLI and plugin-host suites, and a headless drive-harness launch of a locally built binary with `--client tacocode --plugin <skin>`: logo replaced, backdrop input sized to the home route, renderer background from the plugin theme, warm theme in vim normal mode, no theme switcher or Theme row, `cli.json` byte-identical, clean exit, plain launch unaffected. A redsun binary built from a branch whose name contains a slash needs `OPENCODE_TUI_CHANNEL=dev` at launch, because the build derives the storage channel from the branch name.

## Phase 2: Taco Code refactor

Starts after 1.1 through 1.6 ship in a tagged redsun release.

### 2.1 Plugin package

- New `plugin/` directory with `tui.ts` exporting `Plugin.define({ id: "tacocode", api: 1, setup })`.
- Setup registers both themes, calls `lock`, selects `tacocode`, claims `replace: "home.logo"` and `append: "home.backdrop"`, and keeps one effect that selects `tacocode-warm` when `context.vim.mode` is not insert and `tacocode` otherwise.
- Existing pure modules move over as they are. Unit tests move with them; the branding test loses its overlay assertions.
- Ship the plugin precompiled with the OpenTUI Solid transform so both the Bun and Node redsun builds load it without a compile step. Verify this against the distributed redsun binary before relying on source loading.

### 2.2 Launcher

- `tacocode` becomes a small executable whose only job is to locate redsun (`REDSUN_BIN`, then `PATH`) and exec it with `--client tacocode --plugin <install dir>/plugin` plus all user arguments passed through. Help text and version flag stay local.
- The installer places the plugin directory next to the executable. No npm access is needed at runtime and the plugin version is pinned to the launcher version.
- The `redsun` name in error output, the service discovery, the updater, and the health check all go away. Redsun already shows update notices for itself.

### 2.3 Tests and CI

- Unit tests cover the pure modules as today.
- The smoke test runs the launcher against an installed redsun with the drive harness and asserts the logo, backdrop, warm theme in normal mode, unchanged `cli.json`, and clean exit. It runs on every push and nightly against the latest redsun release, so a contract break shows up within a day instead of at the next manual bump.
- The release workflow builds the launcher per platform and packages the plugin directory alongside it.

### 2.4 Removal

- Delete the submodule, overlays, `.cache` overlay outputs, catalog pinning in `package.json`, and the module-sharing test that only existed because of the overlay bundler.
- README describes the launcher and the plugin, and how to run the plugin inside a plain redsun for development by adding it to `cli.json`.

## Phase 2 outcome

| Plan | Implementation |
| --- | --- |
| Installer places the plugin directory next to the executable | The plugin sources are embedded in the launcher at build time (`TACOCODE_PLUGIN_FILES` define) and unpacked once per content hash into `$XDG_CACHE_HOME/tacocode/plugin-<hash>`. Installers, archives, and the single-file distribution are unchanged |
| Ship precompiled with the OpenTUI Solid transform | Shipped as `.tsx` source; redsun's Bun build compiles plugin directories at load and aliases `solid-js` and `@opentui/solid` to its own copies. The only dependencies left in `package.json` are type-checking devDependencies |
| `args.ts` kept as pass-through | `--help` and `--version` are answered locally when they lead; everything else is forwarded to redsun verbatim after `--client tacocode --plugin <dir>` |
| Types from `@opencode/plugin/tui` | `plugin/redsun.ts` mirrors the API 1 subset the plugin uses, since the plugin package is not published |
| Smoke test nightly against the latest redsun | The smoke test runs on demand (`bun run smoke`) against the installed redsun; the release workflow runs unit tests and typecheck only, because runners have no redsun |

Verified: unit tests, typecheck, a Windows build, and the smoke test against installed redsun v26-9-10.1 (cold start, plugin extraction, `#120F18` background in insert mode and `#171310` in normal mode, no theme switcher or Theme row, shared service across two clients, resizing to the text logo, detach, `cli.json` byte-identical).

## Phase 3: nice to have

- `session.backdrop` or a generic `app.backdrop` slot, if the crescent should follow into sessions.
- A `--theme <name>` launch flag so users can pick between Taco Code looks without editing config.
- Publishing the plugin to npm as well, so redsun users who want the skin without the launcher can add `tacocode` to their `cli.json`.

## Open questions to settle before Phase 2

1. Whether the distributed redsun binary is the Bun build. If so, local plugin directories may contain `.tsx`; if the Node build is ever shipped, the plugin must be precompiled. Precompiling is the safe default either way.
2. Whether plugin setup runs before the first home paint. The home route already renders inside `plugins.ready()`, so the logo and theme should be present on the first frame. Confirm with the skin fixture.
3. Whether `packages.prepare` caches npm plugins per version, which decides if the npm path in Phase 3 auto-updates or pins.
4. Whether `home.backdrop` should suppress the update notification's hover background, which currently paints `theme.background.default` over the crescent.

## What this buys

- Redsun releases need no Taco Code work unless the plugin API changes, and the API is versioned and tested in redsun's own CI.
- Users update one thing, redsun, and Taco Code follows. The launcher and plugin only change when the look changes.
- Every hook is generic. Any other skin or frontend can use the same layer, which is the reason to build it in redsun rather than in Taco Code.
