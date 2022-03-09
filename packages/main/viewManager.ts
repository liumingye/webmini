import { MainWindow } from './windows/main'
import { View } from './view'
import { ipcMain } from 'electron'

export class ViewManager {
  public views = new Map<number, View>()

  public selectedId = 0

  private window: MainWindow

  public showTopBar = false

  public autoHideBar = false

  public constructor(window: MainWindow) {
    this.window = window

    const { id } = window.win
    ipcMain.handle(`views-create-${id}`, (e, options) => {
      return options.map((option: any) => {
        const id = this.create(option, false, false).id
        this.select(id, false)
        return id
      })
    })

    ipcMain.handle(`browserview-hide-${id}`, () => {
      this.hide()
    })

    ipcMain.handle(`browserview-show-${id}`, () => {
      this.show()
    })

    // ipcMain.handle(`browserview-clear-${id}`, () => {
    //   this.clear()
    // })

    ipcMain.handle(`topBarStatus-${id}`, (e, { autoHideBar, showTopBar }) => {
      this.autoHideBar = autoHideBar
      this.showTopBar = showTopBar
      this.fixBounds()
    })

    this.select(id, true)
  }

  public select(id: number, focus = true) {
    const view = this.views.get(id)

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

    view.updateNavigationState()
  }

  public async fixBounds() {
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

  public create(details: any, isNext = false, sendMessage = true) {
    const view = new View(this.window, details)

    const { webContents } = view.browserView
    const { id } = view

    this.views.set(id, view)

    webContents.once('destroyed', () => {
      console.log('clear')
      this.views.delete(id)
    })

    if (sendMessage) {
      this.window.send('create-tab', { ...details }, isNext, id)
    }
    return view
  }

  public destroy(id: number) {
    console.log('destroy' + id)

    const view = this.views.get(id)
    this.views.delete(id)

    if (view && !view.isDestroyed()) {
      this.window.win.removeBrowserView(view.browserView)
      view.destroy()
    }
  }

  public clear() {
    this.window.win.setBrowserView(null)
    this.views.forEach((x) => x.destroy())
  }

  public hide() {
    const browserView = this.selected?.browserView
    if (!browserView) return
    this.window.win.removeBrowserView(browserView)
  }

  public show() {
    const browserView = this.selected?.browserView
    if (!browserView) return
    this.window.win.addBrowserView(browserView)
  }
}
