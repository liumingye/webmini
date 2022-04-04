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

/**
 * 载入url
 * @param plugin 插件信息
 * @param url 要载入的url
 * @param args 要传递的参数
 */
export const loadURL = (plugin: LocalPluginInfo | undefined, url: string, ...args: any[]): void => {
  const tabsStore = useTabsStore()
  const tab = tabsStore.getFocusedTab()
  if (!tab) {
    tabsStore.addTabs([{ url, plugin, active: true, ...args }])
  } else {
    tab.url = url
    tab.plugin = plugin
    tab.callViewMethod('loadURL', url, ...args)
  }
}
