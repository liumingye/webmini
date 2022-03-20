import { ipcMain } from 'electron'
import { View } from './view'
import type { MainWindow } from './windows/main'

export class ViewManager {
  public views = new Map<number, View>()

  public selectedId = 0

  private window: MainWindow

  public showTopBar = false

  public autoHideBar = false

  public constructor(window: MainWindow) {
    this.window = window

    const { id } = window.win

    ipcMain.handle(`view-create-${id}`, (e, details) => {
      const id = this.create(details, false, false).id
      return id
    })

    ipcMain.handle(`views-create-${id}`, (e, options) => {
      return options.map((option: any) => {
        const id = this.create(option, false, false).id
        return id
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

    ipcMain.handle(`get-windowType-${id}`, () => {
      return this.selected?.windowType
    })

    ipcMain.handle(`resize-window-size-${id}`, (e, windowType) => {
      this.selected?.resizeWindowSize(windowType)
    })

    this.select(id, true)
  }

  public select(id: number, focus = true): void {
    const view = this.views.get(id)

    if (!view) {
      return
    }

    if (this.selected) {
      this.window.win.removeBrowserView(this.selected.browserView)
    }

    this.selectedId = id

    this.window.win.addBrowserView(view.browserView)

    if (focus) {
      // Also fixes switching tabs with Ctrl + Tab
      view.webContents.focus()
    } else {
      this.window.webContents.focus()
    }

    view.updateTitle()

    this.fixBounds()

    view.updateNavigationState()
  }

  public fixBounds(): void {
    const view = this.selected

    if (!view) return

    const { width, height } = this.window.win.getContentBounds()

    // const topbarContentHeight = await this.window.webContents.executeJavaScript(
    //   `document.getElementsByTagName('header')[0].offsetHeight`,
    // )
    const topbarContentHeight = 32

    const newBounds = {
      x: 0,
      y: this.showTopBar ? topbarContentHeight : 0,
      width,
      height: this.autoHideBar ? height : height - topbarContentHeight,
      // height,
    }

    // console.log(newBounds)
    if (newBounds !== view.bounds) {
      view.browserView.setBounds(newBounds)
      view.bounds = newBounds
    }
  }

  public get selected() {
    return this.views.get(this.selectedId)
  }

  public create(details: any, isNext = false, sendMessage = true): View {
    const view = new View(this.window, details)

    const { webContents } = view.browserView
    const { id } = view

    this.views.set(id, view)

    webContents.once('destroyed', () => {
      this.views.delete(id)
    })

    if (sendMessage) {
      this.window.send('create-tab', { ...details }, isNext, id)
    }
    return view
  }

  public destroy(id: number): void {
    console.log('destroy' + id)

    const view = this.views.get(id)
    this.views.delete(id)

    if (view && !view.isDestroyed()) {
      this.window.win.removeBrowserView(view.browserView)
      view.destroy()
    }
  }

  public clear(): void {
    this.window.win.setBrowserView(null)
    this.views.forEach((x) => x.destroy())
  }

  public hide(): void {
    this.window.win.setBrowserView(null)
  }

  public show(): void {
    const browserView = this.selected?.browserView
    if (!browserView) return
    this.window.win.addBrowserView(browserView)
    this.fixBounds()
  }
}
