import { sites } from '@/config/sites'
import { userAgent } from '@/config/constant'
import { windowType } from '@/types'

class Site {
  private keys = Object.keys(sites)
  private URL
  private completeURL

  constructor(url: string) {
    this.URL = new URL(url)
    this.completeURL = this.URL.hostname + this.URL.pathname + this.URL.search
  }

  public getRule = () => {
    for (const key of this.keys) {
      // window.app.logger.debug(key)
      if (this.URL.hostname.indexOf(key) >= 0) {
        return sites[key]
      }
    }
    return null
  }

  public getUserAgent = () => {
    const rule = this.getRule()
    if (!rule) return userAgent.mobile
    const desktopMap = rule.userAgent.desktop
    for (const value of desktopMap) {
      if (this.completeURL.indexOf(value) >= 0) {
        return userAgent.desktop
      }
    }
    const mobileMap = rule.userAgent.mobile
    for (const value of mobileMap) {
      if (this.completeURL.indexOf(value) >= 0) {
        return userAgent.mobile
      }
    }
    return userAgent.desktop
  }

  public getWindowType = (): windowType => {
    const rule = this.getRule()
    if (!rule) return 'desktop'
    for (const reg of rule.windowType.mini) {
      if (reg.test(this.completeURL)) {
        return 'mini'
      }
    }
    if (this.completeURL.indexOf('passport.bilibili.com/login') >= 0) {
      return 'login'
    } else if (this.completeURL.indexOf('t.bilibili.com/?tab') >= 0) {
      return 'feed'
    } else if (this.getUserAgent() === userAgent.desktop) {
      return 'desktop'
    }
    return 'mobile'
  }
}

export default Site
