import { useTabsStore } from '@/store'

export const callViewMethod = async (
  webContentsId: number,
  method: string,
  ...args: any[]
): Promise<any> => {
  return await window.ipcRenderer.invoke(`webContentsCall`, {
    args,
    method,
    webContentsId,
  })
}

export const loadURL = (url: string, ...args: any[]): void  => {
  const tabsStore = useTabsStore()
  const tab = tabsStore.selectedTab()
  if (!tab) {
    tabsStore.addTabs([{ url, active: true, ...args }])
  } else {
    tab.url = url
    tab.callViewMethod('loadURL', url, ...args)
  }
}
