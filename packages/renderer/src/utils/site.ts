import { matchPattern } from '@/utils'
import { userAgent } from '@/utils/constant'
import { windowType } from '@/types'
import { usePluginStore } from '@/store'

interface CacheTypes {
  url: string | null
  userAgent: string
  windowType: windowType
}

const cache = reactive<CacheTypes>({
  url: null,
  userAgent: userAgent.mobile,
  windowType: 'mobile',
})

class Site {
  private URL: URL
  private completeURL: string
  public userAgent: string
  public windowType: windowType

  constructor(url: string) {
    this.URL = new URL(url)
    this.completeURL = this.URL.hostname + this.URL.pathname + this.URL.search
    if (cache.url === this.completeURL) {
      this.userAgent = cache.userAgent
      this.windowType = cache.windowType
    } else {
      cache.url = this.completeURL
      cache.userAgent = this.userAgent = this.getUserAgent()
      cache.windowType = this.windowType = this.getWindowType()
    }
  }

  private getUserAgent = () => {
    window.app.logger.debug('getUserAgent', { lable: 'siteUtils' })
    const pluginStore = usePluginStore()
    const userAgentProvider = {
      mobile: [],
      desktop: [],
    }
    const [$_userAgent]: Record<string, string[]>[] = pluginStore.registerAndGetData(
      'userAgent',
      userAgentProvider,
    )
    if ($_userAgent.desktop.some((value) => this.completeURL.includes(value))) {
      return userAgent.desktop
    }
    if ($_userAgent.mobile.some((value) => this.completeURL.includes(value))) {
      return userAgent.mobile
    }
    return userAgent.desktop
  }

  private getWindowType = (): windowType => {
    window.app.logger.debug('getWindowType', { lable: 'siteUtils' })
    const pluginStore = usePluginStore()
    const windowTypeProvider = {
      mini: [],
    }
    const [windowType]: Record<string, (string | RegExp)[]>[] = pluginStore.registerAndGetData(
      'windowType',
      windowTypeProvider,
    )
    const mini = windowType.mini
    if (mini.some(matchPattern(this.completeURL))) {
      return 'mini'
    }
    // todo: 特殊大小窗口判断代码移动到插件内
    if (this.completeURL.indexOf('passport.bilibili.com/login') >= 0) {
      return 'login'
    } else if (this.completeURL.indexOf('t.bilibili.com/?tab') >= 0) {
      return 'feed'
    }
    const isCache = cache.url === this.completeURL
    if (isCache && cache.userAgent === userAgent.desktop) {
      return 'desktop'
    } else if (!isCache && this.getUserAgent() === userAgent.desktop) {
      return 'desktop'
    }
    return 'mobile'
  }
}

export default Site
