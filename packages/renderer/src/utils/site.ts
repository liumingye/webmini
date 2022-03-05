import { sites } from '@/config/sites'
import { userAgent } from '@/config/constant'
import { windowType } from '@/types'
import { usePluginStore } from '@/store'
import { isRegExp, isString } from 'lodash-es'

class Site {
  private keys = Object.keys(sites)
  private URL
  private completeURL

  constructor(url: string) {
    this.URL = new URL(url)
    this.completeURL = this.URL.hostname + this.URL.pathname + this.URL.search
  }

  public getUserAgent = () => {
    const pluginStore = usePluginStore()

    const userAgentProvider = {
      mobile: [],
      desktop: [],
    }
    const [_userAgent]: Record<string, string[]>[] = pluginStore.registerAndGetData(
      'userAgent',
      userAgentProvider,
    )

    // console.log(_userAgent)
    // console.log(this.completeURL)

    const desktopMap = _userAgent.desktop
    for (const value of desktopMap) {
      if (this.completeURL.indexOf(value) >= 0) {
        return userAgent.desktop
      }
    }
    const mobileMap = _userAgent.mobile
    for (const value of mobileMap) {
      if (this.completeURL.indexOf(value) >= 0) {
        return userAgent.mobile
      }
    }
    return userAgent.desktop
  }

  public getWindowType = (): windowType => {
    const pluginStore = usePluginStore()

    const windowTypeProvider = {
      mini: [],
    }
    const [windowType]: Record<string, (string | RegExp)[]>[] = pluginStore.registerAndGetData(
      'windowType',
      windowTypeProvider,
    )

    const mini = windowType.mini
    for (const reg of mini) {
      if (isString(reg)) {
        if (this.completeURL.indexOf(reg) >= 0) {
          return 'mini'
        }
      } else if (isRegExp(reg)) {
        if (reg.test(this.completeURL)) {
          return 'mini'
        }
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
