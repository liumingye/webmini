import { TabsStateTypes } from './type'
import { ITab } from './model'
import { useAppStore } from '@/store'
import { CreateProperties } from '~/interfaces/tabs'

export const useTabsStore = defineStore('tabs', {
  state: (): TabsStateTypes => ({
    list: [],
    selectedTabId: -1, // webContentsId
  }),
  actions: {
    // init() {
    //   const appStore = useAppStore()
    //   window.ipcRenderer.on('tabEvent', (ev, event: TabEvent, tabId, args) => {
    //     const tab = this.getTabById(tabId)
    //     if (tab) {
    //       if (event === 'title-updated') tab.title = args[0]
    //       if (event === 'loading') tab.loading = args[0]
    //       if (event === 'url-updated') {
    //         const [url] = args
    //         tab.url = url
    //         appStore.updateURL(url, tabId)
    //       }
    //     }
    //   })
    // },
    createTabs(options: CreateProperties[], ids: number[]) {
      const tabs = options.map((option, i) => {
        const tab = new ITab(option, ids[i])
        this.list.push(tab)
        return tab
      })
      return tabs
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
    selectedTab() {
      return this.getTabById(this.selectedTabId)
    },
    getTabById(id: number): ITab | undefined {
      return this.list.find((x) => x.id === id)
    },
  },
  getters: {},
})
