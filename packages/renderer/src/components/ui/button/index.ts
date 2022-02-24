import type { App } from 'vue'
import { getComponentPrefix } from '../_utils/global-config'
import _Button from './button.vue'

const Button = Object.assign(_Button, {
  install: (app: App) => {
    const componentPrefix = getComponentPrefix()
    app.component(componentPrefix + 'Button', _Button)
  },
})

export default Button
