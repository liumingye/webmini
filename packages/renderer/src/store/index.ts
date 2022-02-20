import { createPinia } from 'pinia'
import { useAppStore } from './modules/app'
import { useHistoryStore } from './modules/history'

const pinia = createPinia()

export { useAppStore,useHistoryStore }
export default pinia
