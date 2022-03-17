import {
  clipboard,
  ContextMenuParams,
  dialog,
  Menu,
  MenuItemConstructorOptions,
  WebContents,
} from 'electron'
import { extname } from 'path'
import { isURI, prefixHttp } from '~/common/uri'
import { MainWindow } from '../windows/main'

export const saveAs = async (mainWindow: MainWindow) => {
  const selected = mainWindow.viewManager.selected
  if (!selected) return
  const { title, webContents } = selected

  const { canceled, filePath } = await dialog.showSaveDialog({
    defaultPath: title,
    filters: [
      { name: '页面源码', extensions: ['html', 'htm'] },
      { name: '网页归档', extensions: ['*'] },
    ],
  })

  if (canceled || !filePath) return

  const ext = extname(filePath)

  webContents.savePage(filePath, ext === '.htm' ? 'HTMLOnly' : 'HTMLComplete')
}

export const getViewMenu = (
  mainWindow: MainWindow,
  params: ContextMenuParams,
  webContents: WebContents,
) => {
  let menuItems: MenuItemConstructorOptions[] = []

  if (params.linkURL !== '') {
    menuItems = menuItems.concat([
      {
        label: '打开链接',
        click: () => {
          const selected = mainWindow.viewManager.selected
          if (!selected) return
          selected.webContents.loadURL(params.linkURL)
        },
      },
      {
        type: 'separator',
      },
      {
        label: '拷贝链接',
        click: () => {
          clipboard.clear()
          clipboard.writeText(params.linkURL)
        },
      },
      {
        type: 'separator',
      },
    ])
  }

  if (params.hasImageContents) {
    menuItems = menuItems.concat([
      {
        label: '拷贝图像',
        click: () => webContents.copyImageAt(params.x, params.y),
      },
      {
        label: '拷贝图像地址',
        click: () => {
          clipboard.clear()
          clipboard.writeText(params.srcURL)
        },
      },
      {
        label: '存储图片为...',
        click: () => {
          mainWindow.webContents.downloadURL(params.srcURL)
        },
      },
      {
        type: 'separator',
      },
    ])
  }

  if (params.isEditable) {
    menuItems = menuItems.concat([
      {
        label: '撤销',
        role: 'undo',
        accelerator: 'CmdOrCtrl+Z',
      },
      {
        label: '重做',
        role: 'redo',
        accelerator: 'CmdOrCtrl+Shift+Z',
      },
      {
        type: 'separator',
      },
      {
        label: '剪切',
        role: 'cut',
        accelerator: 'CmdOrCtrl+X',
      },
      {
        label: '拷贝',
        role: 'copy',
        accelerator: 'CmdOrCtrl+C',
      },
      {
        label: '粘贴',
        role: 'paste',
        accelerator: 'CmdOrCtrl+Shift+V',
      },
      {
        label: '粘贴并匹配样式',
        role: 'pasteAndMatchStyle',
        accelerator: 'CmdOrCtrl+V',
      },
      {
        label: '全选',
        role: 'selectAll',
        accelerator: 'CmdOrCtrl+A',
      },
      {
        type: 'separator',
      },
    ])
  }

  if (!params.isEditable && params.selectionText !== '') {
    menuItems = menuItems.concat([
      {
        label: '拷贝',
        role: 'copy',
        accelerator: 'CmdOrCtrl+C',
      },
      {
        type: 'separator',
      },
    ])
  }

  if (params.selectionText !== '') {
    const trimmedText = params.selectionText.trim()

    if (isURI(trimmedText)) {
      menuItems = menuItems.concat([
        {
          label: '打开URL ' + trimmedText,
          click: () => {
            mainWindow.viewManager.create(
              {
                url: prefixHttp(trimmedText),
                active: true,
              },
              true,
            )
          },
        },
        {
          type: 'separator',
        },
      ])
    }
  }

  if (
    !params.hasImageContents &&
    params.linkURL === '' &&
    params.selectionText === '' &&
    !params.isEditable
  ) {
    menuItems = menuItems.concat([
      {
        label: '返回',
        accelerator: 'Alt+Left',
        enabled: webContents.canGoBack(),
        click: () => {
          webContents.goBack()
        },
      },
      {
        label: '前进',
        accelerator: 'Alt+Right',
        enabled: webContents.canGoForward(),
        click: () => {
          webContents.goForward()
        },
      },
      {
        label: '重新载入页面',
        accelerator: 'CmdOrCtrl+R',
        click: () => {
          webContents.reload()
        },
      },
      {
        type: 'separator',
      },
      {
        label: '将网页存储为...',
        accelerator: 'CmdOrCtrl+S',
        click: async () => {
          saveAs(mainWindow)
        },
      },
      {
        label: '打印页面...',
        accelerator: 'CmdOrCtrl+P',
        click: async () => {
          webContents.print()
        },
      },
      {
        type: 'separator',
      },
      {
        label: '查看页面源文件',
        accelerator: 'CmdOrCtrl+U',
        click: () => {
          const viewManager = mainWindow.viewManager
          viewManager.create(
            {
              url: `view-source:${viewManager.selected?.url}`,
              active: true,
            },
            true,
          )
        },
      },
    ])
  }

  menuItems.push({
    label: '检查元素',
    accelerator: 'CmdOrCtrl+Shift+I',
    click: () => {
      webContents.inspectElement(params.x, params.y)
      if (webContents.isDevToolsOpened()) {
        webContents.devToolsWebContents?.focus()
      }
    },
  })

  return Menu.buildFromTemplate(menuItems)
}
