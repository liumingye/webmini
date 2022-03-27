import type { TabsStateTypes } from './type'
import { ITab } from './model'
import { useAppStore } from '@/store'
import type { CreateProperties } from '~/interfaces/tabs'
import { cloneDeep } from 'lodash'

export const useTabsStore = defineStore('tabs', {
  state: (): TabsStateTypes => ({
    list: [],
    tabId: -1, // webContentsId
  }),
  actions: {
    /**
     * 创建新的标签页
     * @param options 创建标签页的参数
     * @param id 创建的标签页的 webContentsId
     * @returns {ITab}
     */
    createTab(options: CreateProperties, id: number): ITab {
      const tab = new ITab(options, id)
      if (options.index !== undefined) {
        this.list.splice(options.index, 0, tab)
      } else {
        this.list.push(tab)
      }
      return tab
    },
    /**
     * 创建多个标签页
     * @param options 创建标签页的参数
     * @param ids 创建的标签页的 webContentsId
     * @returns {Promise<ITab[]>}
     */
    createTabs(options: CreateProperties[], ids: number[]): ITab[] {
      const tabs = options.map((option, i) => {
        const tab = new ITab(option, ids[i])
        this.list.push(tab)
        return tab
      })
      return tabs
    },
    /**
     * 添加标签页
     * @param options 添加标签页的参数
     * @returns {Promise<ITab>}
     */
    async addTab(options: CreateProperties): Promise<ITab> {
      const appStore = useAppStore()
      const opts = { ...{ active: true }, ...options }
      const id: number = await window.ipcRenderer.invoke(
        `view-create-${appStore.currentWindowID}`,
        cloneDeep(opts),
      )
      return this.createTab(opts, id)
    },
    /**
     * 添加多个标签页
     * @param options 添加标签页的参数
     * @returns {Promise<ITab[]>}
     */
    async addTabs(options: CreateProperties[]): Promise<ITab[]> {
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
        cloneDeep(options),
      )
      return this.createTabs(options, ids)
    },
    /**
     * 获取集中标签页
     * @returns {ITab | undefined}
     */
    getFocusedTab(): ITab | undefined {
      return this.getTabById(this.tabId)
    },
    /**
     * 获取标签页
     * @param tabId  标签页id
     * @returns {ITab | undefined}
     */
    getTabById(tabId: number): ITab | undefined {
      return this.list.find((tab) => tab.id === tabId)
    },
  },
  getters: {},
})
