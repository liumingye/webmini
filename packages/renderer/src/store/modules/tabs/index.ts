import { TabsStateTypes, CreateProperties } from './type'
import { ITab } from './model'
import { useAppStore } from '@/store'

export const useTabsStore = defineStore('tabs', {
  state: (): TabsStateTypes => ({
    list: [],
    removedTabs: 0,
  }),
  actions: {
    createTabs(options: CreateProperties[], ids: number[]) {
      this.removedTabs = 0
      const tabs = options.map((option, i) => {
        const tab = new ITab(option, ids[i])
        this.list.push(tab)
        return tab
      })
      return tabs
    },
    async addTabs(options: CreateProperties[]) {
      const appStore = useAppStore()
      // ipcRenderer.send(`hide-window-${appStore.currentWindowID}`);
      for (let i = 0; i < options.length; i++) {
        if (i === options.length - 1) {
          options[i].active = true
        } else {
          options[i].active = false
        }
      }
      const ids = await window.ipcRenderer.invoke(
        `views-create-${appStore.currentWindowID}`,
        options,
      )
      return this.createTabs(options, ids)
    },
  },
  getters: {},
})
