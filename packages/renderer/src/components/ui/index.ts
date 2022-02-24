import type { App, Plugin } from 'vue'
import Button from './button'

const components: Record<string, Plugin> = {
  Button,
}

const install = (app: App) => {
  for (const key of Object.keys(components)) {
    app.use(components[key])
  }
}

export default {
  ...components,
  install,
}
