# Taco Code

The redsun TUI with a fixed purple-and-white Taco Code theme and pixel-art bell logo. Sessions, tools, agents, models, integrations, and configuration are provided by your installed redsun.

## Install

Install [redsun](https://github.com/and2049/redsun#install) first for local sessions, then install Taco Code with one command:

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
curl -fsSL https://github.com/and2049/tacocode/releases/latest/download/install | bash -s -- --version 0.1.0 --no-modify-path
```

```powershell
& ([scriptblock]::Create((irm https://github.com/and2049/tacocode/releases/latest/download/install.ps1))) -Version 0.1.0 -NoModifyPath
```

Re-run the installer to update Taco Code. Close Taco Code before updating on Windows. You can also extract an archive from [Releases](https://github.com/and2049/tacocode/releases) and put `tacocode` (`tacocode.exe` on Windows) on PATH manually. An explicit `--server` URL can connect to an existing redsun server without a local redsun executable.

## Run

```sh
tacocode
tacocode /path/to/project
tacocode --continue
tacocode --session ses_example
tacocode --server http://localhost:4096
```

`tacocode --help` lists TUI options. `REDSUN_BIN` can select a specific redsun executable. For an explicit authenticated server, use redsun's `OPENCODE_PASSWORD` environment variable.

Local startup delegates to `redsun service start`, which discovers or starts the shared background service. Taco Code authenticates through redsun's service registration. Closing the TUI leaves the service running. Reconnection and restart use the same installed redsun executable.

## Configuration

Taco Code uses redsun's configuration, state, history, and plugin directories, including XDG overrides and `OPENCODE_CONFIG_DIR`. Terminal preferences are read from redsun's `cli.json`; project and server settings remain owned by redsun.

The saved theme is excluded from Taco Code's effective configuration. Theme commands are hidden and the palette is fixed. Updating other preferences preserves the theme stored for the native redsun TUI. Other preference changes are shared between the two frontends.

The icon and wordmark appear in standard-height terminals. The icon is the purple bell in vim insert mode and switches to the taco in normal and command mode, where the CODE half of the wordmark turns golden and the whole background shifts to a warm brown to match; short terminals use the wordmark, and narrow terminals use a compact text logo so the prompt remains usable. Behind the home screen, a faint purple crescent is drawn from half-block cells with the same technique as the logo, so it needs no image protocol support from the terminal.

## Build

Requires Git and Bun 1.4.2. Runtime users do not need either source checkout or Bun.

```sh
git clone --recurse-submodules <this-repository>
cd tacocode
bun install --frozen-lockfile
bun test ./test
bun run build
bun script/smoke.ts
bun run install-local
```

The integration smoke test requires installed redsun and uses temporary, isolated configuration and service directories. It checks cold startup, multiple clients, settings, resizing, and detaching, then stops its test service and removes the temporary data. Rendered frames are saved under `.cache/` for visual inspection.

The local installer copies into `~/.redsun/bin` on Windows or `~/.local/bin` on Linux/macOS. Override the destination with `TACOCODE_INSTALL_DIR`.

```sh
bun run dev
bun run dev -- --continue
bun install --os="*" --cpu="*"
bun run build --target=bun-linux-x64
```

Release targets: Windows, Linux (glibc), and macOS on x64 and arm64. Native builds are recommended so OpenTUI's platform dependencies are installed for the target. The release workflow builds each target on a matching runner, checks the executable, and produces archives with SHA-256 checksums.

## Source and updates

The `vendor/redsun` Git submodule pins the baseline to `56c66ad69a81c2d8ee1805fb3a704db68b6b7b62`. The version shown in the TUI is the connected redsun service's version; Taco Code's own version is only printed by `--version`. The V2 health contract is validated on connection; compatibility with later protocol changes requires updating the source baseline.

`script/overlays.ts` contains checked, build-time changes to the original TUI. It generates files under `.cache/overlays`, preserving upstream imports and applying the regular OpenTUI Solid transform. Layout and interaction code comes directly from redsun. Custom artwork and palette live under `src/`. A changed upstream patch point fails the build rather than silently dropping a customization.

Upstream module paths are normalized before resolution. This keeps Windows slash variants from creating duplicate Solid contexts and ensures absolute imports receive the same theme overrides as package imports. The module identity regression test covers this boundary.

The full upstream workspace is available for resolving its internal packages, but the executable entrypoint is TUI-only. Backend operations use the installed redsun. The in-TUI redsun update action updates redsun; Taco Code releases are installed separately.

When updating the submodule, review overlays, synchronize dependency versions and patches with the upstream manifest, regenerate the lockfile, and run tests and release builds.

Upstream code is MIT licensed; see `vendor/redsun/LICENSE`.
