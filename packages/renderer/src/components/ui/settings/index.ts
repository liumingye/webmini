import type { App } from 'vue'
import { getComponentPrefix } from '../_utils/global-config'
import _Tile from './tile.vue'

const Settings = {
  install: (app: App) => {
    const componentPrefix = getComponentPrefix()
    app.component(componentPrefix + 'settings-tile', _Tile)
  },
}

export default Settings
