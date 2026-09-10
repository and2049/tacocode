# Taco Code

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


