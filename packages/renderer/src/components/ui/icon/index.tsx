import type { App } from 'vue'
import * as IconMap from './map'

const install = (app: App): void  => {
  Object.values(IconMap).forEach((icon) => {
    app.component(icon.name, icon)
  })
}

export default install
