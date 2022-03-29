import { getCurrentWindow, screen } from '@electron/remote'
import { contextBridge, ipcRenderer } from 'electron'
import { withPrototype } from '~/common'
import Cookies from '~/common/cookies'
import { domContentLoaded } from '~/common/dom'
import Logger from '~/common/logger'
import Net from '~/common/net'
import useLoading from './utils/loading'
import Versions from './utils/versions'

const { appendLoading, removeLoading } = useLoading()

domContentLoaded().then(appendLoading)

// --------- Expose some API to the Renderer process. ---------
contextBridge.exposeInMainWorld('removeLoading', removeLoading)
contextBridge.exposeInMainWorld('ipcRenderer', withPrototype(ipcRenderer))

const {
  minimize,
  setBounds,
  getPosition,
  getSize,
  hide,
  on,
  once,
  isDestroyed,
  isAlwaysOnTop,
  setAlwaysOnTop,
  id,
} = getCurrentWindow()

contextBridge.exposeInMainWorld('app', {
  cookies: new Cookies(),
  versions: new Versions(),
  screen: withPrototype(screen),
  currentWindow: {
    minimize,
    setBounds,
    getPosition,
    getSize,
    hide,
    on,
    once,
    isDestroyed,
    isAlwaysOnTop,
    setAlwaysOnTop,
    id,
  },
  net: new Net(),
  logger: withPrototype(Logger),
})
