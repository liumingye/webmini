import type { App } from 'vue'
import { getComponentPrefix } from '../_utils/global-config'
import _Button from './Button.vue'

const Button = {
  install: (app: App): void => {
    const componentPrefix = getComponentPrefix()
    app.component(componentPrefix + 'button', _Button)
  },
}

export default Button
