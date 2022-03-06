import { contextBridge, ipcRenderer } from 'electron'
import { getCurrentWindow, screen, app } from '@electron/remote'
import useLoading from './utils/loading'
import domReady from './utils/domReady'
import { Logger, Versions, Cookies, Net } from './apis'
import { resolve } from 'path'
import Storage from 'electron-json-storage'

const { appendLoading, removeLoading } = useLoading()
;(async () => {
  await domReady()
  appendLoading()
})()

// `exposeInMainWorld` can't detect attributes and methods of `prototype`, manually patching it.
const withPrototype = (obj: Record<string, any>) => {
  const protos = Object.getPrototypeOf(obj)
  for (const [key, value] of Object.entries(protos)) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) continue
    if (typeof value === 'function') {
      // Some native APIs, like `NodeJS.EventEmitter['on']`, don't work in the Renderer process. Wrapping them into a function.
      obj[key] = function (...args: any) {
        return value.call(obj, ...args)
      }
    } else {
      obj[key] = value
    }
  }
  return obj
}

// --------- Expose some API to the Renderer process. ---------
contextBridge.exposeInMainWorld('removeLoading', removeLoading)
contextBridge.exposeInMainWorld('ipcRenderer', withPrototype(ipcRenderer))

Storage.setDataPath(app.getPath('userData'))
const currentWindow = getCurrentWindow()
contextBridge.exposeInMainWorld('app', {
  storage: Storage,
  cookies: new Cookies(),
  versions: new Versions(),
  screen: withPrototype(screen),
  preload: 'file://' + resolve(__dirname, '../inject/index.cjs'),
  currentWindow: {
    minimize: currentWindow.minimize,
    setBounds: currentWindow.setBounds,
    getPosition: currentWindow.getPosition,
    getSize: currentWindow.getSize,
    hide: currentWindow.hide,
    on: currentWindow.on,
    once: currentWindow.once,
    isDestroyed: currentWindow.isDestroyed,
    isAlwaysOnTop: currentWindow.isAlwaysOnTop,
    setAlwaysOnTop: currentWindow.setAlwaysOnTop,
    id: currentWindow.id,
  },
  net: new Net(),
  logger: withPrototype(Logger),
})
