import { contextBridge, ipcRenderer } from 'electron'
import { getCurrentWindow, screen } from '@electron/remote'
import { useLoading } from './utils/loading'
import { domReady } from './utils/dom'
import logger from './utils/logger'
import versions from './utils/versions'
import cookies from './utils/cookies'
import net from './utils/net'
import { resolve } from 'path'

const { appendLoading, removeLoading } = useLoading()
;(async () => {
  await domReady()
  appendLoading()
})()

// --------- Expose some API to the Renderer process. ---------
contextBridge.exposeInMainWorld('removeLoading', removeLoading)
contextBridge.exposeInMainWorld('ipcRenderer', withPrototype(ipcRenderer))

const currentWindow = getCurrentWindow()
contextBridge.exposeInMainWorld('app', {
  cookies: new cookies(),
  versions: new versions(),
  screen: withPrototype(screen),
  preload: 'file://' + resolve(__dirname, '../inject/index.cjs'),
  currentWindow: {
    setBounds: currentWindow.setBounds,
    getPosition: currentWindow.getPosition,
    getSize: currentWindow.getSize,
    hide: currentWindow.hide,
    on: currentWindow.on,
    once: currentWindow.once,
    isDestroyed: currentWindow.isDestroyed,
  },
  net: new net(),
  logger: withPrototype(logger),
})

// `exposeInMainWorld` can't detect attributes and methods of `prototype`, manually patching it.
function withPrototype(obj: Record<string, any>) {
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
