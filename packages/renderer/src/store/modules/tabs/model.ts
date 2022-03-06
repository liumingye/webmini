import { CreateProperties } from './type'
import { useAppStore, useTabsStore } from '@/store'
import NProgress from 'nprogress' // progress bar
import { replaceTitle } from '@/utils' // progress bar

export class ITab {
  public id = -1

  public url = ''

  public _title = 'bilimini'

  public isClosing = false

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
    if (!this.isClosing) {
      const appStore = useAppStore()
      const tabsStore = useTabsStore()
      tabsStore.selectedTabId = this.id
      window.ipcRenderer.send(`browserview-show-${appStore.currentWindowID}`)
    }
  }
}
