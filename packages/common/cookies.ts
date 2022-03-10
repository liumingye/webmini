// A `Cookies` object for this session.
import { getCurrentWindow } from '@electron/remote'

class Cookies {
  private cookies

  constructor() {
    this.cookies = getCurrentWindow().webContents.session.cookies
  }

  public get = (filter: Electron.CookiesGetFilter) => {
    return this.cookies.get(filter)
  }
}

export default Cookies
