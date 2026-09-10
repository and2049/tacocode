import { cell, type PixelCell } from "./logo-art"

const tints = ["#15111C", "#191420", "#1C1725", "#1F1A29", "#231D2E"] as const

export function tint(x: number, y: number, width: number, height: number): string | undefined {
  const u = x / width
  const v = y / height
  const bulge = Math.sin(Math.PI * u ** 1.4)
  const center = 0.36 + 0.34 * bulge + 0.18 * u
  const halfWidth = 0.1 + 0.12 * bulge
  const intensity = Math.max(0, 1 - Math.abs(v - center) / halfWidth)
  return tints[Math.ceil(intensity * tints.length) - 1]
}

export function backdrop(columns: number, rows: number): readonly (readonly PixelCell[])[] {
  const height = rows * 2
  return Array.from({ length: rows }, (_, y) =>
    Array.from({ length: columns }, (_, x) => cell(tint(x, y * 2, columns, height), tint(x, y * 2 + 1, columns, height))),
  )
}
