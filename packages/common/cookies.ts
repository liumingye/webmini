// A `Cookies` object for this session.
import { getCurrentWindow } from '@electron/remote'

class Cookies {
  private cookies

  constructor(cookies = getCurrentWindow().webContents.session.cookies) {
    this.cookies = cookies
  }

  public get = (filter: Electron.CookiesGetFilter) => {
    return this.cookies.get(filter)
  }
}

export default Cookies
