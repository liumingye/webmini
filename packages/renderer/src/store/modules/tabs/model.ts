import { useAppStore, useTabsStore } from '@/store'
import { replaceTitle } from '@/utils'
import { callViewMethod } from '@/utils/view'
import NProgress from 'nprogress' // progress bar
import type { CreateProperties } from '~/interfaces/tabs'

export class ITab {
  public id = -1

  public url = ''

  public _title = 'webmini'

  public constructor({ active, url }: CreateProperties, id: number) {
    this.url = url
    this.id = id
    if (active) {
      requestAnimationFrame(() => {
        this.select()
      })
    }
  }

  public get title() {
    return this._title
  }

  public set title(value: string) {
    const appStore = useAppStore()
    this._title = replaceTitle(value)
    appStore.title = document.title = this._title
  }

  public set loading(value: boolean) {
    if (value) {
      NProgress.start().inc()
    } else {
      NProgress.done()
    }
  }

  public async select() {
    const appStore = useAppStore()
    const tabsStore = useTabsStore()
    tabsStore.tabId = this.id
    await window.ipcRenderer.invoke(`view-select-${appStore.currentWindowID}`, this.id)
  }

  public callViewMethod = (scope: string, ...args: any[]): Promise<any> => {
    return callViewMethod(this.id, scope, ...args)
  }
}
