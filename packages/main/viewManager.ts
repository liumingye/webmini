import { EventEmitter } from 'events'
import { MainWindow } from './windows/main'
import { View } from './view'
import { ipcMain } from 'electron'

export class ViewManager extends EventEmitter {
  public views = new Map<number, View>()
  // public incognito: boolean
  public selectedId = 0

  private window: MainWindow

  public _showTopBar = true

  public get showTopBar() {
    return this._showTopBar
  }

  public set showTopBar(val: boolean) {
    this._showTopBar = val
    this.fixBounds()
  }

  public constructor(window: MainWindow) {
    super()
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
      this.hide(id)
    })

    ipcMain.handle(`browserview-show-${id}`, () => {
      this.show(id)
    })

    // ipcMain.handle(`browserview-clear-${id}`, () => {
    //   this.clear()
    // })

    ipcMain.handle(`showTopBar-${id}`, (e, options) => {
      this.showTopBar = options
    })

    // this.setBoundsListener()

    // this.incognito = incognito
    this.select(id, true)
  }

  public select(id: number, focus = true) {
    // const { selected } = this.selected

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
      // height: this.showTopBar ? height - topbarContentHeight : height,
      height,
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
    // console.log(view)
    if (view && !view.browserView.webContents.isDestroyed()) {
      this.window.win.removeBrowserView(view.browserView)
      view.destroy()
    }
  }

  public clear() {
    this.window.win.setBrowserView(null)
    this.views.forEach((x) => this.destroy(x.id))
  }

  public hide(id?: number) {
    const browserView = id
      ? this.views.get(this.selectedId)?.browserView
      : this.selected?.browserView
    if (!browserView) return
    this.window.win.removeBrowserView(browserView)
  }

  public show(id?: number) {
    const browserView = id
      ? this.views.get(this.selectedId)?.browserView
      : this.selected?.browserView
    if (!browserView) return
    this.window.win.addBrowserView(browserView)
  }
}
