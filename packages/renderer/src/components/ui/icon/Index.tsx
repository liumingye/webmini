import type { App, Plugin } from 'vue'
import Home from './icons/Home'
import Left from './icons/Left'
import Right from './icons/Right'
import Windmill from './icons/Windmill'
import CloseSmall from './icons/CloseSmall'
import Help from './icons/Help'

const components: Record<string, Plugin> = {
  Home,
  Left,
  Right,
  Windmill,
  CloseSmall,
  Help,
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
