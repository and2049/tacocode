import { expect, test } from "bun:test"
import { createHash } from "node:crypto"
import { chmod, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

const installer = path.resolve(import.meta.dirname, "../install")
const unix = process.platform !== "win32"

async function fixture(run: (context: {
  root: string
  destination: string
  install: (args?: string[], env?: Record<string, string | undefined>) => Promise<{ code: number; output: string }>
}) => Promise<void>) {
  const root = await mkdtemp(path.join(os.tmpdir(), "tacocode-installer-test-"))
  const destination = path.join(root, "home", "Taco's bin")
  try {
    for (const dir of ["mock", "archive", "home", "tmp"]) await mkdir(path.join(root, dir))
    const binary = path.join(root, "archive/tacocode")
    await writeFile(binary, "#!/bin/sh\necho 'tacocode v0.1.0'\n")
    await chmod(binary, 0o755)
    const archive = path.join(root, "release.tar.gz")
    const tar = Bun.spawn(["tar", "-czf", archive, "-C", path.dirname(binary), "."])
    if (await tar.exited !== 0) throw new Error("Failed to create fixture archive")
    const hash = createHash("sha256").update(await readFile(archive)).digest("hex")
    const mocks = {
      uname: '#!/bin/sh\ncase "$1" in -s) echo "${TEST_OS:-Linux}";; -m) echo "${TEST_ARCH:-x86_64}";; esac\n',
      sysctl: '#!/bin/sh\necho "${TEST_ROSETTA:-0}"\n',
      ldd: '#!/bin/sh\necho "${TEST_LIBC:-glibc}"\n',
      curl: `#!/bin/bash
set -eu
out=''
url=''
while [[ $# -gt 0 ]]; do
  case "$1" in
    -o) out=$2; shift 2 ;;
    --retry) shift 2 ;;
    https://*) url=$1; shift ;;
    *) shift ;;
  esac
done
printf '%s\\n' "$url" >> "$TEST_ROOT/requests"
if [[ \${TEST_DOWNLOAD_FAIL:-} == true ]]; then exit 22; fi
case "$url" in
  */releases/latest) echo '{"tag_name":"v0.1.0"}' ;;
  *.sha256)
    filename=\${url##*/}
    printf '%s  %s\\n' "\${TEST_HASH}" "\${filename%.sha256}" > "$out"
    ;;
  *.tar.gz) cp "$TEST_ROOT/release.tar.gz" "$out" ;;
  *) exit 1 ;;
esac
`,
    }
    for (const [name, content] of Object.entries(mocks)) {
      const file = path.join(root, "mock", name)
      await writeFile(file, content)
      await chmod(file, 0o755)
    }
    await run({
      root,
      destination,
      async install(args = [], env = {}) {
        const child = Bun.spawn(["bash", installer, ...args], {
          env: {
            ...process.env,
            HOME: path.join(root, "home"),
            TMPDIR: path.join(root, "tmp"),
            PATH: `${root}/mock:${process.env.PATH}`,
            SHELL: "/bin/bash",
            BASH_ENV: "",
            VERSION: "",
            GITHUB_ACTIONS: "false",
            TACOCODE_INSTALL_DIR: destination,
            TEST_ROOT: root,
            TEST_HASH: hash,
            ...env,
          },
          stdout: "pipe",
          stderr: "pipe",
        })
        const [code, stdout, stderr] = await Promise.all([
          child.exited,
          new Response(child.stdout).text(),
          new Response(child.stderr).text(),
        ])
        return { code, output: stdout + stderr }
      },
    })
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

test.skipIf(!unix)("installer resolves latest, installs verified archive, and configures quoted PATH idempotently", async () => {
  await fixture(async ({ root, destination, install }) => {
    expect((await install()).code).toBe(0)
    expect(await Bun.file(path.join(destination, "tacocode")).exists()).toBe(true)
    expect(await readFile(path.join(root, "requests"), "utf8")).toContain("/download/v0.1.0/tacocode-linux-x64.tar.gz")
    const config = path.join(root, "home/.bashrc")
    const before = await readFile(config, "utf8")
    const shell = Bun.spawn(["bash", "-c", 'source "$1"; command -v tacocode', "bash", config], { stdout: "pipe" })
    expect((await new Response(shell.stdout).text()).trim()).toBe(path.join(destination, "tacocode"))
    expect(await shell.exited).toBe(0)
    expect((await install()).code).toBe(0)
    expect(await readFile(config, "utf8")).toBe(before)
  })
})

test.skipIf(!unix)("installer honors pinned versions, Rosetta, no-modify-path, and GitHub PATH", async () => {
  await fixture(async ({ root, destination, install }) => {
    const githubPath = path.join(root, "github-path")
    const result = await install(["--version", "v0.1.0", "--no-modify-path"], {
      TEST_OS: "Darwin", TEST_ROSETTA: "1", GITHUB_ACTIONS: "true", GITHUB_PATH: githubPath,
    })
    expect(result.code).toBe(0)
    const requests = await readFile(path.join(root, "requests"), "utf8")
    expect(requests).toContain("tacocode-darwin-arm64.tar.gz")
    expect(requests).not.toContain("/releases/latest")
    expect(await Bun.file(path.join(root, "home/.bashrc")).exists()).toBe(false)
    expect((await readFile(githubPath, "utf8")).trim()).toBe(destination)
  })
})

test.skipIf(!unix)("installer preserves existing executable on checksum or download failure", async () => {
  await fixture(async ({ root, destination, install }) => {
    await mkdir(destination)
    const binary = path.join(destination, "tacocode")
    await writeFile(binary, "existing executable")
    for (const env of [{ TEST_HASH: "0".repeat(64) }, { TEST_DOWNLOAD_FAIL: "true" }]) {
      expect((await install(["--version", "0.1.0"], env)).code).not.toBe(0)
      expect(await readFile(binary, "utf8")).toBe("existing executable")
    }
    expect(await Bun.file(path.join(root, "home/.bashrc")).exists()).toBe(false)
    expect(await readdir(path.join(root, "tmp"))).toEqual([])
  })
})

test.skipIf(!unix)("installer rejects unsupported platforms and invalid options before downloading", async () => {
  await fixture(async ({ root, install }) => {
    for (const env of [{ TEST_ARCH: "riscv64" }, { TEST_OS: "FreeBSD" }, { TEST_LIBC: "musl" }]) {
      expect((await install([], env)).code).not.toBe(0)
    }
    for (const args of [["--version"], ["--unknown"], ["--version", "../bad"]]) {
      expect((await install(args)).code).not.toBe(0)
    }
    expect((await install(["--help"])).code).toBe(0)
    expect(await Bun.file(path.join(root, "requests")).exists()).toBe(false)
  })
})
