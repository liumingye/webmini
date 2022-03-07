import { CreateProperties } from '~/interfaces/tabs'
import { useAppStore, useTabsStore } from '@/store'
import NProgress from 'nprogress' // progress bar
import { replaceTitle } from '@/utils'
import { callViewMethod } from '@/utils/view'

export class ITab {
  public id = -1

  public url = ''

  public _title = 'bilimini'

  public constructor({ active, url }: CreateProperties, id: number) {
    this.url = url
    this.id = id
    if (active) {
      requestAnimationFrame(() => {
        this.select()
      })
    }
    NProgress.configure({ easing: 'ease', speed: 200, trickleSpeed: 50, showSpinner: false })
  }

  public get title() {
    return this._title
  }

  public set title(value: string) {
    const appStore = useAppStore()
    this._title = replaceTitle(value) || 'bilimini'
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
    const tabsStore = useTabsStore()
    tabsStore.selectedTabId = this.id
    window.ipcRenderer.send(`browserview-show-${this.id}`)
  }

  public callViewMethod = (scope: string, ...args: any[]): Promise<any> => {
    console.log(args)
    return callViewMethod(this.id, scope, ...args)
  }
}
