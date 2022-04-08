import { ipcMain } from 'electron'
import is from 'electron-is'
import { View } from './view'
import type { MainWindow } from './windows/main'

export class ViewManager {
  private readonly viewContainer = new Map<number, View>()

  public selectedId = 0

  private window: MainWindow

  private showTopBar = true

  private autoHideBar = false

  public constructor(window: MainWindow) {
    this.window = window

    const { id } = window.win

    ipcMain.handle(`view-create-${id}`, (e, details) => {
      const view = this.registerViewContainer(details, false, false)
      return view.id
    })

    ipcMain.handle(`views-create-${id}`, (e, options) => {
      return options.map((option: any) => {
        const view = this.registerViewContainer(option, false, false)
        return view.id
      })
    })

    ipcMain.handle(`view-select-${id}`, (e, id: number, focus: boolean) => {
      this.select(id, focus)
    })

    ipcMain.handle(`browserview-hide-${id}`, () => {
      this.hide()
    })

    ipcMain.handle(`browserview-show-${id}`, () => {
      this.show()
    })

    ipcMain.handle(`top-bar-status-${id}`, (e, { autoHideBar, showTopBar }) => {
      this.autoHideBar = autoHideBar
      this.showTopBar = showTopBar
      this.fixBounds()
    })

    ipcMain.handle(`resize-window-size-${id}`, (e, windowType) => {
      this.selected?.resizeWindowSize(windowType)
    })
  }

  public select(id: number, focus = true): void {
    // 防止重复执行
    if (this.selectedId === id) {
      return
    }

    const view = this.viewContainer.get(id)

    if (!view) {
      return
    }

    this.selectedId = id

    if (this.selected) {
      this.window.win.removeBrowserView(this.selected.browserView)
    }

    this.window.win.addBrowserView(view.browserView)

    if (focus) {
      // Also fixes switching tabs with Ctrl + Tab
      view.webContents.focus()
    } else {
      this.window.webContents.focus()
    }

    this.fixBounds()

    if (view.firstSelect === true) {
      // 第一次选择时跳过，避免重复执行
      view.firstSelect = false
    } else {
      view.browserView.webContents.emit('did-change-theme-color')
      view.loadPlugins()
      view.setUserAgent()
      view.updateTitle()
      view.updateNavigationState()
      view.resizeWindowSize(undefined, true)
    }
  }

  /**
   * fixBounds
   * @description 修复浏览器窗口大小
   * @returns void
   */
  public fixBounds(): void {
    const view = this.selected

    if (!view) return

    const { width, height } = this.window.win.getContentBounds()

    const topbarContentHeight = 32

    const newBounds = {
      x: 0,
      y: this.showTopBar ? topbarContentHeight : 0,
      width,
      height: this.autoHideBar ? height : height - topbarContentHeight,
    }

    if (newBounds !== view.bounds) {
      view.browserView.setBounds(newBounds)
      view.bounds = newBounds
    }
  }

  public get selected() {
    return this.viewContainer.get(this.selectedId)
  }

  public registerViewContainer(details: any, isNext = false, sendMessage = true): View {
    const view = new View(this.window, details)

    const { webContents } = view.browserView
    const { id } = view

    this.viewContainer.set(id, view)

    if (details.active) {
      this.select(id, true)
    }

    webContents.once('destroyed', () => {
      this.viewContainer.delete(id)
    })

    if (sendMessage) {
      this.window.send('create-tab', details, isNext, id)
    }

    /**
     * [mac] 下 setAutoResize 会有偏移
     * 这里关闭 setAutoResize 使用 fixBounds 手动改变大小
     */
    if (!is.macOS()) {
      view.browserView.setAutoResize({
        width: true,
        height: true,
      })
    }

    return view
  }

  public deregisterViewContainer(id: number): void {
    console.log('deregisterViewContainer' + id)

    const view = this.viewContainer.get(id)
    this.viewContainer.delete(id)

    if (view && !view.isDestroyed()) {
      this.window.win.removeBrowserView(view.browserView)
      view.destroy()
    }
  }

  public clearViewContainer(): void {
    this.window.win.setBrowserView(null)
    this.viewContainer.forEach((view) => {
      this.deregisterViewContainer(view.id)
    })
  }

  public hide(): void {
    const browserView = this.selected?.browserView
    if (!browserView) return
    this.window.win.removeBrowserView(browserView)
  }

  public show(): void {
    const browserView = this.selected?.browserView
    if (!browserView) return
    this.window.win.addBrowserView(browserView)
    this.fixBounds()
  }
}
