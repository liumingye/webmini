import type Electron from 'electron'
import is from 'electron-is'
import type { CookiesApi } from '../interfaces'

const electron: typeof Electron = is.renderer()
  ? // renderer
    require('@electron/remote')
  : // main
    require('electron')

/**
 * A `Cookies` object for this session.
 */
class Cookies implements CookiesApi {
  private cookies

  constructor(cookies = electron.session.defaultSession.cookies) {
    this.cookies = cookies
  }

  public get = (filter: Electron.CookiesGetFilter) => {
    return this.cookies.get(filter)
  }
}

export default Cookies
