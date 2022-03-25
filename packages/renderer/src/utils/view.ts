import { useTabsStore } from '@/store'
import type { LocalPluginInfo } from '~/interfaces/plugin'

export const callViewMethod = async (
  webContentsId: number,
  method: string,
  ...args: any[]
): Promise<any> => {
  if (webContentsId === -1) return
  return await window.ipcRenderer.invoke(`web-contents-call`, {
    args,
    method,
    webContentsId,
  })
}

export const loadURL = (plugin: LocalPluginInfo | undefined, url: string, ...args: any[]): void => {
  const tabsStore = useTabsStore()
  const tab = tabsStore.getFocusedTab()
  if (!tab) {
    tabsStore.addTabs([{ plugin, url, active: true, ...args }])
  } else {
    tab.url = url
    tab.callViewMethod('loadURL', url, ...args)
  }
}
