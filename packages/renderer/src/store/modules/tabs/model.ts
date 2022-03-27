import { useAppStore, useTabsStore } from '@/store'
import { replaceTitle } from '@/utils'
import { callViewMethod } from '@/utils/view'
import NProgress from 'nprogress' // progress bar
import type { CreateProperties } from '~/interfaces/tabs'
import type { LocalPluginInfo } from '~/interfaces/plugin'

export class ITab {
  public id = -1

  public url = ''

  public _title = 'webmini'

  public plugin: LocalPluginInfo | undefined

  public constructor({ active, url, plugin }: CreateProperties, id: number) {
    this.plugin = plugin
    this.url = url
    this.id = id
    if (active) {
      requestAnimationFrame(() => {
        this.select()
      })
    }
  }

  /**
   * 获取标签页的标题
   */
  public get title() {
    return this._title
  }

  /**
   * 设置标签页的标题
   */
  public set title(value: string) {
    const appStore = useAppStore()
    this._title = replaceTitle(value)
    appStore.title = document.title = this._title
  }

  /**
   * 设置标签页的加载状态
   */
  public set loading(value: boolean) {
    if (value) {
      NProgress.start().inc()
    } else {
      NProgress.done()
    }
  }

  /**
   * 选中标签页
   */
  public async select() {
    const appStore = useAppStore()
    const tabsStore = useTabsStore()
    tabsStore.tabId = this.id
    await window.ipcRenderer.invoke(`view-select-${appStore.currentWindowID}`, this.id)
  }

  /**
   * 调用标签页的方法
   * @param scope 方法的作用域
   * @param args 方法的参数
   * @returns {Promise<any>}
   */
  public callViewMethod = (scope: string, ...args: any[]): Promise<any> => {
    return callViewMethod(this.id, scope, ...args)
  }
}
