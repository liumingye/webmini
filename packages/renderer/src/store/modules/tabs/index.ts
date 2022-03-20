import type { TabsStateTypes } from './type'
import { ITab } from './model'
import { useAppStore } from '@/store'
import type { CreateProperties } from '~/interfaces/tabs'

export const useTabsStore = defineStore('tabs', {
  state: (): TabsStateTypes => ({
    list: [],
    tabId: -1, // webContentsId
  }),
  actions: {
    createTab(options: CreateProperties, id: number) {
      const tab = new ITab(options, id)
      if (options.index !== undefined) {
        this.list.splice(options.index, 0, tab)
      } else {
        this.list.push(tab)
      }
      return tab
    },
    createTabs(options: CreateProperties[], ids: number[]) {
      const tabs = options.map((option, i) => {
        const tab = new ITab(option, ids[i])
        this.list.push(tab)
        return tab
      })
      return tabs
    },
    async addTab(options: CreateProperties) {
      const appStore = useAppStore()
      const opts = { ...{ active: true }, ...options }
      const id: number = await window.ipcRenderer.invoke(
        `view-create-${appStore.currentWindowID}`,
        opts,
      )
      return this.createTab(opts, id)
    },
    async addTabs(options: CreateProperties[]) {
      const appStore = useAppStore()
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
    getFocusedTab(): ITab | undefined {
      return this.getTabById(this.tabId)
    },
    getTabById(tabId: number): ITab | undefined {
      return this.list.find((tab) => tab.id === tabId)
    },
  },
  getters: {},
})
