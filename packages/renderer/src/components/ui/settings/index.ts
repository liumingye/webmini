import type { App } from 'vue'
import { getComponentPrefix } from '../_utils/global-config'
import _Settings from './SettingsContainer.vue'
import _Tile from './SettingsTile.vue'

const Settings = {
  install: (app: App): void  => {
    const componentPrefix = getComponentPrefix()
    app.component(componentPrefix + 'settings', _Settings)
    app.component(componentPrefix + 'settings-tile', _Tile)
  },
}

export default Settings
