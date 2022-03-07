import { useTabsStore } from '@/store'

export const callViewMethod = async (
  webContentsId: number,
  method: string,
  ...args: any[]
): Promise<any> => {
  return await window.ipcRenderer.invoke(`web-contents-call`, {
    args,
    method,
    webContentsId,
  })
}

export const loadURL = (url: string, ...args: any[]) => {
  const tabsStore = useTabsStore()
  const tab = tabsStore.selectedTab()
  if (!tab) {
    // const details: CreateProperties = { url, active: true, ...args }
    // if (args && args[0]) {
    //   details.options = args[0]
    // }
    tabsStore.addTabs([{ url, active: true, ...args }])
  } else {
    tab.url = url
    console.log(args)
    tab.callViewMethod('loadURL', url, ...args)
  }
}
