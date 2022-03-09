import { getCurrentWindow } from '@electron/remote'

class Cookies {
  constructor(
    // A `Cookies` object for this session.
    private cookies = getCurrentWindow().webContents.session.cookies,
  ) {}
  public get = (filter: Electron.CookiesGetFilter) => {
    return this.cookies.get(filter)
  }
}

export default Cookies
