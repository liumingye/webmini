import { EventEmitter } from 'events'
import { MainWindow } from './windows/main'
import { View } from './view'
import { ipcMain } from 'electron'

export class ViewManager extends EventEmitter {
  public views = new Map<number, View>()
  // public incognito: boolean
  public selectedId = 0

  private window: MainWindow

  public constructor(window: MainWindow) {
    super()
    this.window = window

    const { id } = window.win
    ipcMain.handle(`views-create-${id}`, (e, options) => {
      console.log(options)
      return options.map((option: any) => {
        const id = this.create(option, false, false).id
        this.select(id, false)
        return id
      })
    })

    ipcMain.handle(`views-clear-${id}`, () => {
      this.clear()
    })

    // this.create({ url: 'https://tools.liumingye.cn/music' }, false, false).id
    this.setBoundsListener()

    // this.incognito = incognito
    this.select(id, true)
  }

  private setBoundsListener() {
    // resize the BrowserView's height when the toolbar height changes
    // ex: when the bookmarks bar appears
    this.window.webContents.executeJavaScript(`
        // import electron from 'electron';
        // // const electron = require('electron');
        // const resizeObserver = new ResizeObserver(([{ contentRect }]) => {
        //   electron.ipcRenderer.send('resize-height');
        // });
        // const app2 = document.getElementById('app');
        // resizeObserver.observe(app2);
      `)

    this.window.webContents.on('ipc-message', (e, message) => {
      if (message === 'resize-height') {
        // this.fixBounds()
      }
    })
  }

  public select(id: number, focus = true) {
    const { selected } = this
    // const view = this.views.get(2)
    // console.log(this.views)
    const view = this.views.get(id)

    if (!view) {
      return
    }

    this.selectedId = id

    if (selected) {
      this.window.win.removeBrowserView(selected.browserView)
    }

    this.window.win.addBrowserView(view.browserView)

    // console.log(121213213213213)

    if (focus) {
      // Also fixes switching tabs with Ctrl + Tab
      view.webContents.focus()
    } else {
      this.window.webContents.focus()
    }

    // this.window.updateTitle()
    // view.updateBookmark()
    // console.log(111111111111111)
    this.fixBounds()

    // view.updateNavigationState()

    this.emit('activated', id)

    // TODO: this.emitZoomUpdate(false);
  }

  public async fixBounds() {
    const view = this.selected
    if (!view) return
    const { width, height } = this.window.win.getContentBounds()
    // const toolbarContentHeight = await this.window.win.webContents.executeJavaScript(`
    //   document.getElementById('app').offsetHeight
    // `)
    const newBounds = {
      x: 0,
      y: 32,
      width,
      height: height - 32,
    }
    // console.log(newBounds)
    if (newBounds !== view.bounds) {
      view.browserView.setBounds(newBounds)
      view.bounds = newBounds
    }
  }

  public get selected() {
    return this.views.get(this.selectedId)
    // return this.views.get(2)
  }

  public create(details: any, isNext = false, sendMessage = true) {
    const view = new View(this.window, details.url)

    const { webContents } = view.browserView
    const { id } = view

    this.views.set(id, view)

    // console.log(view)
    console.log(this.views)
    // if (process.env.ENABLE_EXTENSIONS) {
    //   extensions.tabs.observe(webContents)
    // }

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

    if (view && !view.browserView.webContents.isDestroyed()) {
      this.window.win.removeBrowserView(view.browserView)
      view.destroy()
      this.emit('removed', id)
    }
  }

  public clear() {
    this.window.win.setBrowserView(null)
    this.views.forEach((x) => {
      this.destroy(x.id)
    })
  }
}
