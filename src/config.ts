export function withoutTheme(value: unknown): unknown {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return value
  const { theme: _theme, ...config } = value as Record<string, unknown>
  return config
}
