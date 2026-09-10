import { parseTheme, resolveThemeDocument } from "@opencode/theme/tui"

export const palette = {
  background: "#120F18",
  panel: "#211C27",
  purple: "#AF50F5",
  lavender: "#D7B8F3",
  white: "#F7F3ED",
  muted: "#A29BAA",
} as const

export const warm = {
  background: "#171310",
  panel: "#251F1A",
  element: "#2F2721",
  borderSubtle: "#3A302A",
} as const

export const tacoTheme = {
  mode: "dark",
  theme: {
    logoGradientStart: palette.white,
    logoGradientEnd: palette.purple,
    primary: palette.lavender,
    secondary: palette.purple,
    accent: palette.purple,
    error: "#F184A0",
    warning: "#F2D65C",
    success: "#A5CD94",
    info: "#C5AEED",
    agentBuild: palette.lavender,
    agentPlan: "#C4A3ED",
    agentCompose: "#D99DE8",
    text: palette.white,
    textMuted: palette.muted,
    background: palette.background,
    backgroundPanel: palette.panel,
    backgroundElement: "#2B2334",
    border: "#62516E",
    borderActive: palette.lavender,
    borderSubtle: "#33283E",
    diffAdded: "#A5CD94",
    diffRemoved: "#F184A0",
    diffContext: palette.muted,
    diffHunkHeader: palette.lavender,
    diffHighlightAdded: "#B9E2A7",
    diffHighlightRemoved: "#FFADC0",
    diffLineNumber: "#807189",
    markdownText: palette.white,
    markdownHeading: palette.lavender,
    markdownLink: "#C399F4",
    markdownLinkText: "#DDB9FA",
    markdownCode: "#E4B6EC",
    markdownBlockQuote: palette.muted,
    markdownEmph: "#DAC3F2",
    markdownStrong: palette.white,
    markdownHorizontalRule: "#62516E",
    markdownListItem: palette.lavender,
    markdownListEnumeration: "#F2D65C",
    markdownImage: palette.purple,
    markdownImageText: palette.lavender,
    markdownCodeBlock: palette.white,
    syntaxComment: "#978B9F",
    syntaxKeyword: "#C99BF6",
    syntaxFunction: "#E1BDF8",
    syntaxVariable: palette.white,
    syntaxString: "#B6D9A5",
    syntaxNumber: "#F2D65C",
    syntaxType: "#DCA9DF",
    syntaxOperator: "#D6C2E9",
    syntaxPunctuation: "#B0A3BA",
  },
} as const

export const warmTheme = {
  ...tacoTheme,
  theme: { ...tacoTheme.theme, background: warm.background, backgroundPanel: warm.panel, backgroundElement: warm.element, borderSubtle: warm.borderSubtle },
} as const

export const fixedTheme = resolveThemeDocument(parseTheme(tacoTheme, "tacocode"), "dark")
