export const callViewMethod = async (id: number, method: string, ...args: any[]): Promise<any> => {
  return await window.ipcRenderer.invoke(`web-contents-call`, {
    args,
    method,
    webContentsId: id,
  })
}
