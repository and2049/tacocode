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

## DoorDash

On Windows, Taco Code also connects [doordash-mcp](https://github.com/and2049/doordash-mcp) so the agent can browse restaurants, edit the cart, and order. The plugin registers the server with the running redsun service for the current directory at launch; nothing is written to your redsun configuration, and the registration is gone when the service restarts. Until then, other redsun clients opened in the same directory see the server too. The server starts as `npx -y doordash-mcp@0.1.3 serve`, so Node.js 22 or newer must be on PATH.

Sign in once before the first order:

```powershell
npx -y doordash-mcp@0.1.3 login-help
```

Run the printed command, finish the DoorDash sign-in in Chrome, then run `npx -y doordash-mcp@0.1.3 attach` and `npx -y doordash-mcp@0.1.3 verify`. Sessions are stored with Windows DPAPI and survive upgrades. `place_order` charges the saved card on your DoorDash account.

## Run

```sh
tacocode
tacocode /path/to/project
tacocode --continue
tacocode --session ses_example
tacocode --server http://localhost:4096
```

`tacocode --help` and `tacocode --version` are answered locally. Every other argument is passed to redsun unchanged, so `redsun --help` lists the options. `REDSUN_BIN` can select a specific redsun executable.

The launcher runs `redsun --client tacocode --plugin <plugin directory> [your arguments]`; the plugin then adds the DoorDash MCP server through the redsun API. The plugin directory is embedded in the executable and unpacked once per version into `$XDG_CACHE_HOME/tacocode` (`~/.cache/tacocode` by default). Service discovery, reconnection, restart, and update notices are redsun's own.


