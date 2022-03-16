import { useAppStore, useTabsStore } from '@/store'
import { callViewMethod } from '@/utils/view'
import type { TabEvent, CreateProperties } from '~/interfaces/tabs'
import type { AppStateTypes } from '@/store/modules/app/types'
import { currentWindowType } from '@/utils'

export const ipcRendererOn = (): void => {
  const appStore = useAppStore()
  const tabsStore = useTabsStore()

  // browser事件
  window.ipcRenderer.on('tabEvent', (ev, event: TabEvent, tabId, args) => {
    const tab = tabsStore.getTabById(tabId)
    if (tab) {
      if (event === 'title-updated') tab.title = args[0]
      if (event === 'loading') tab.loading = args[0]
      if (event === 'url-updated') {
        const [url] = args
        tab.url = url
        appStore.updateURL(url, tabId)
      }
    }
  })

  // 设置主题
  window.ipcRenderer.on('setThemeColor', (ev, theme) => {
    document.body.style.setProperty('--theme-color-bg', theme.bg)
    document.body.style.setProperty('--theme-color-text', theme.text)
    document.body.setAttribute('arco-theme', theme.theme)
    console.log('setThemeColor')
  })

  // navigation state
  window.ipcRenderer.on('updateNavigationState', (e, data) => {
    appStore.navigationState = data
  })

  // 收到选p消息时跳p
  window.ipcRenderer.on('go', (ev, url) => {
    appStore.go(url)
  })

  // 用户按↑、↓键时，把事件传递到webview里去实现修改音量功能
  window.ipcRenderer.on('changeVolume', (ev, arg) => {
    callViewMethod(tabsStore.selectedTabId, 'send', 'changeVolume', arg)
    // webview.value.send('changeVolume', arg)
  })

  // setCurrentWindowType
  window.ipcRenderer.on('setCurrentWindowType', (e, windowType) => {
    currentWindowType.value = windowType
  })

  // 按下ESC键
  window.ipcRenderer.on('pressEsc', () => {
    tabsStore.selectedTab()?.callViewMethod('goBack')
  })

  // setAppState
  window.ipcRenderer.on(
    'setAppState',
    <T extends keyof AppStateTypes>(
      e: Electron.IpcRendererEvent,
      key: T,
      value: AppStateTypes[T],
    ) => {
      appStore.$state[key] = value
    },
  )

  window.ipcRenderer.on(
    'create-tab',
    (e, options: CreateProperties, isNext: boolean, id: number) => {
      const selectedTab = tabsStore.selectedTab()
      if (isNext && selectedTab) {
        const index = tabsStore.list.indexOf(selectedTab) + 1
        options.index = index
      }
      tabsStore.createTab(options, id)
    },
  )

  window.ipcRenderer.on('select-next-tab', () => {
    const selectedTab = tabsStore.selectedTab()
    if (!selectedTab) return
    const i = tabsStore.list.indexOf(selectedTab)
    const nextTab = tabsStore.list[i + 1]

    if (!nextTab) {
      if (tabsStore.list[0]) {
        tabsStore.list[0].select()
      }
    } else {
      nextTab.select()
    }
  })

  window.ipcRenderer.on('select-previous-tab', () => {
    const selectedTab = tabsStore.selectedTab()
    if (!selectedTab) return
    const i = tabsStore.list.indexOf(selectedTab)
    const prevTab = tabsStore.list[i - 1]

    if (!prevTab) {
      if (tabsStore.list[tabsStore.list.length - 1]) {
        tabsStore.list[tabsStore.list.length - 1].select()
      }
    } else {
      prevTab.select()
    }
  })

  window.ipcRenderer.send('ipc-init-complete')
}
