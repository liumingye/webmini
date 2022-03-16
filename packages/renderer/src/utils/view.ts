import { useTabsStore } from '@/store'

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

export const loadURL = (url: string, ...args: any[]): void => {
  const tabsStore = useTabsStore()
  const tab = tabsStore.selectedTab()
  if (!tab) {
    tabsStore.addTabs([{ url, active: true, ...args }])
  } else {
    tab.url = url
    tab.callViewMethod('loadURL', url, ...args)
  }
}
