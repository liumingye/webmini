import type { App, Plugin } from 'vue'
import Button from './button'
import Settings from './settings'

const components: Record<string, Plugin> = {
  Button,
  Settings,
}

const install = (app: App): void => {
  for (const key of Object.keys(components)) {
    app.use(components[key])
  }
}

export default {
  ...components,
  install,
}
