import { contextBridge, ipcRenderer } from 'electron'
import { getCurrentWindow, screen, session } from '@electron/remote'
import useLoading from './utils/loading'
import { withPrototype } from '~/common'
import { domContentLoaded } from '~/common/dom'
import Cookies from '~/common/cookies'
import Net from '~/common/net'
import Logger from '~/common/logger'
import Versions from './utils/versions'
import { StorageService } from '~/main/services/storage'

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
  storage: StorageService.instance,
  cookies: new Cookies(),
  versions: new Versions(),
  screen: withPrototype(screen),
  session: withPrototype(session),
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
