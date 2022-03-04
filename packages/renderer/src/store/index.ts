import { useAppStore } from './modules/app'
import { useHistoryStore } from './modules/history'
import { usePluginStore } from './modules/plugin'

const pinia = createPinia()

export { useAppStore, useHistoryStore, usePluginStore }
export default pinia
