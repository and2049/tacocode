import { Backdrop } from "./backdrop"
import { Logo } from "./logo"
import { connectServers } from "./mcp"
import type { Definition } from "./redsun"
import { tacoTheme, warmTheme } from "./theme"

const plugin: Definition = {
  id: "tacocode",
  api: 1,
  setup(context) {
    context.themes.register("tacocode", tacoTheme)
    context.themes.register("tacocode-warm", warmTheme)
    context.themes.lock()
    context.themes.select("tacocode")
    context.ui.slot({ replace: "home.logo", render: () => <Logo context={context} /> })
    context.ui.slot({
      append: "home.backdrop",
      render: (input) => <Backdrop context={context} width={input.width} height={input.height} />,
    })
    return connectServers(context)
  },
}

export default plugin
