import { useAppStore } from './modules/app'
import { useTabsStore } from './modules/tabs'

const pinia = createPinia()

export { useAppStore, useTabsStore }
export default pinia
