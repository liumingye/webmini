import { app, BrowserWindow, ipcMain, Menu, shell, MenuItemConstructorOptions } from 'electron'
import { release } from 'os'
import { join } from 'path'
import { initialize, enable } from '@electron/remote/main'
import updateElectronApp from 'update-electron-app'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

initialize()

const isDev = !app.isPackaged
const URL = isDev
  ? `http://${process.env['VITE_DEV_SERVER_HOST']}:${process.env['VITE_DEV_SERVER_PORT']}`
  : `file://${join(app.getAppPath(), 'dist/renderer/index.html')}`

let mainWindow: BrowserWindow | null = null // 主窗口
let selectPartWindow: BrowserWindow | null // 分p窗口

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 375,
    height: 500,
    frame: false, // 是否有边框
    maximizable: false,
    alwaysOnTop: true,
    webPreferences: {
      webviewTag: true,
      preload: join(__dirname, '../preload/index.cjs'), // 预先加载指定的脚本
      nativeWindowOpen: false,
      webSecurity: false,
    },
  })

  mainWindow.loadURL(URL)

  enable(mainWindow.webContents) // 渲染进程中使用remote

  mainWindow.on('closed', () => {
    mainWindow = null
    console.log('主窗口：已关闭')
    // 主窗口关闭后如果3s都没有重新创建，就认为程序是被不正常退出了（例如windows下直接alt+f4），关闭整个程序
    if (process.platform != 'darwin') {
      setTimeout(() => {
        console.log('主窗口：关闭超过 3s 未重新创建，程序自动退出')
        app.quit()
      }, 3000)
    }
  })

  // Make all links open with the browser, not with the application
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  // mainWindow.on("mouse-enter", () => {});
}

const createMenu = () => {
  // 菜单
  const template: MenuItemConstructorOptions[] = [
    {
      label: app.name,
      submenu: [
        { label: `关于 ${app.name}`, role: 'about' },
        { type: 'separator' },
        { label: '服务', role: 'services' },
        { type: 'separator' },
        { label: `隐藏 ${app.name}`, role: 'hide' },
        { label: '隐藏其他', role: 'hideOthers' },
        { label: '全部显示', role: 'unhide' },
        { type: 'separator' },
        { label: `退出 ${app.name}`, role: 'quit' },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { label: '拷贝', role: 'copy' },
        { label: '粘贴', role: 'paste' },
        { label: '删除', role: 'delete' },
        { label: '全选', role: 'selectAll' },
        {
          label: '返回',
          accelerator: 'Esc',
          click() {
            mainWindow?.webContents.send('press-esc')
          },
        },
        {
          label: '提高音量',
          accelerator: 'Up',
          click() {
            mainWindow?.webContents.send('change-volume', 'up')
          },
        },
        {
          label: '降低音量',
          accelerator: 'Down',
          click() {
            mainWindow?.webContents.send('change-volume', 'down')
          },
        },
      ],
    },
    {
      label: '窗口',
      role: 'window',
      submenu: [
        { label: '最小化', role: 'minimize' },
        { label: '关闭', role: 'close' },
      ],
    },
    {
      label: 'DEBUG',
      submenu: [
        {
          label: 'Inspect Main Window',
          accelerator: 'CmdOrCtrl+1',
          click() {
            mainWindow?.webContents.openDevTools()
          },
        },
        {
          label: 'Inspect Select Part Window',
          accelerator: 'CmdOrCtrl+2',
          click() {
            selectPartWindow?.webContents.openDevTools()
          },
        },
        // {
        //   label: "Inspect Config Window",
        //   accelerator: "CmdOrCtrl+3",
        //   click() {
        //     // mainWindow?.webContents.send("test", 123);
        //   },
        // },
        {
          label: 'Inspect Webview',
          accelerator: 'CmdOrCtrl+4',
          click() {
            mainWindow?.webContents.send('openWebviewDevTools')
          },
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  console.log('主线程：所有窗口关闭')
  if (process.platform !== 'darwin') app.quit()
})

// 当运行第二个实例时, 将会聚焦到主窗口
app.on('second-instance', () => {
  if (mainWindow) {
    // Focus on the main window if the user tried to open another
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  } else {
    mainWindow.show()
  }
})

ipcMain.on('close-main-window', () => {
  if (process.platform == 'darwin') {
    mainWindow?.close()
    selectPartWindow?.hide()
  } else {
    app.quit()
  }
})

// 初始化选分p窗口
const createSelectPartWindow = () => {
  console.log('选p窗口：开始创建')

  selectPartWindow = new BrowserWindow({
    show: false,
    width: 200,
    height: 300,
    frame: false,
    maximizable: false,
    alwaysOnTop: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'), // 预先加载指定的脚本
    },
  })

  selectPartWindow.loadURL(`${URL}#/select-part`)

  enable(selectPartWindow.webContents) // 渲染进程中使用remote

  selectPartWindow.on('closed', () => {
    selectPartWindow = null
    console.log('选p窗口：已关闭')
  })
  console.log('选p窗口：已创建')
  // 切换、可开可关
  const showSelectPartWindow = () => {
    console.log('选p窗口：打开')
    if (!mainWindow || !selectPartWindow) {
      return
    }
    const p = mainWindow.getPosition(),
      s = selectPartWindow.getSize(),
      pos = [p[0] - s[0], p[1]]
    selectPartWindow.setPosition(pos[0], pos[1])
    selectPartWindow.show()
  }
  ipcMain.on('toggle-select-part-window', () => {
    if (selectPartWindow && selectPartWindow.isVisible()) {
      selectPartWindow.hide()
    } else {
      showSelectPartWindow()
    }
  })
  // 仅开启
  ipcMain.on('show-select-part-window', showSelectPartWindow)
}

// electron 初始化完成
app
  .whenReady()
  .then(() => {
    // 初始化 remote
    createWindow()
    createMenu()
    createSelectPartWindow()
  })
  .then(() => {
    selectPartWindow?.webContents.on('did-finish-load', () => {
      selectPartWindow?.webContents.send('windowID', {
        mainWindow: mainWindow?.id,
      })
    })
    mainWindow?.webContents.on('did-finish-load', () => {
      mainWindow?.webContents.send('windowID', {
        selectPartWindow: selectPartWindow?.id,
      })
    })
    if (isDev) {
      installExtension(VUEJS3_DEVTOOLS.id)
        .then((name) => console.log(`Added Extension:  ${name}`))
        .catch((err) => console.log('An error occurred: ', err))
    }
    updateElectronApp({
      updateInterval: '1 hour',
    })
  })
