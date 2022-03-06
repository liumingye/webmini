import { useAppStore } from './modules/app'
import { useHistoryStore } from './modules/history'
import { usePluginStore } from './modules/plugin'
import { useTabsStore } from './modules/tabs'

const pinia = createPinia()

export { useAppStore, useHistoryStore, usePluginStore, useTabsStore }
export default pinia
