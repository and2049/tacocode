import { cell, type PixelCell } from "./logo-art"
import type { Look } from "./look"

export function tint(x: number, y: number, width: number, height: number, tints: readonly string[]): string | undefined {
  const u = x / width
  const v = y / height
  const bulge = Math.sin(Math.PI * u ** 1.4)
  const center = 0.36 + 0.34 * bulge + 0.18 * u
  const halfWidth = 0.1 + 0.12 * bulge
  const intensity = Math.max(0, 1 - Math.abs(v - center) / halfWidth)
  return tints[Math.ceil(intensity * tints.length) - 1]
}

export function backdrop(columns: number, rows: number, look: Pick<Look, "base" | "tints">): readonly (readonly PixelCell[])[] {
  const height = rows * 2
  const color = (x: number, y: number) => tint(x, y, columns, height, look.tints)
  return Array.from({ length: rows }, (_, y) =>
    Array.from({ length: columns }, (_, x) => cell(color(x, y * 2), color(x, y * 2 + 1), look.base)),
  )
}
