interface Listener {
  onBeforeRequest: (
    details: Electron.OnBeforeRequestListenerDetails,
  ) => Electron.Response | undefined
  onBeforeSendHeaders: (
    details: Electron.OnBeforeSendHeadersListenerDetails,
  ) => Electron.BeforeSendResponse | undefined
  onHeadersReceived: (
    details: Electron.OnHeadersReceivedListenerDetails,
  ) => Electron.HeadersReceivedResponse | undefined
}

export class Sessions {
  private readonly listeners = {
    beforeRequest: [] as Listener['onBeforeRequest'][],
    beforeSendHeaders: [] as Listener['onBeforeSendHeaders'][],
    headersReceived: [] as Listener['onHeadersReceived'][],
  }

  /**
   * Sessions 助手
   * @param sess
   */
  constructor(public sess: Electron.Session, urls: string[] = []) {
    this.sess.webRequest.onBeforeRequest({ urls }, (details, callback) => {
      let _callback = {}
      for (const beforeRequest of this.listeners.beforeRequest) {
        _callback = { ..._callback, ...beforeRequest(details) }
      }
      callback(_callback)
    })

    this.sess.webRequest.onBeforeSendHeaders({ urls }, (details, callback) => {
      let _callback = {}
      for (const beforeSendHeaders of this.listeners.beforeSendHeaders) {
        _callback = { ..._callback, ...beforeSendHeaders(details) }
      }
      callback(_callback)
    })

    this.sess.webRequest.onHeadersReceived({ urls }, (details, callback) => {
      let _callback = {}
      for (const headersReceived of this.listeners.headersReceived) {
        _callback = { ..._callback, ...headersReceived(details) }
      }
      callback(_callback)
    })
  }

  /**
   * 注册
   * @param event
   * @param listener
   * @returns 取消函数
   */
  public register(event: 'onBeforeRequest', listener: Listener['onBeforeRequest']): () => boolean
  public register(
    event: 'onBeforeSendHeaders',
    listener: Listener['onBeforeSendHeaders'],
  ): () => boolean
  public register(
    event: 'onHeadersReceived',
    listener: Listener['onHeadersReceived'],
  ): () => boolean
  public register<T extends keyof Listener>(event: T, listener: any): () => boolean {
    switch (event) {
      case 'onBeforeRequest':
        this.listeners.beforeRequest.push(listener)
        break
      case 'onBeforeSendHeaders':
        this.listeners.beforeSendHeaders.push(listener)
        break
      case 'onHeadersReceived':
        this.listeners.headersReceived.push(listener)
        break
    }
    // returns a unregister function
    return () => {
      return this.unregister(event, listener)
    }
  }

  /**
   * 取消注册
   * @param event
   * @param listener
   * @returns 是否成功
   */
  public unregister<T extends keyof Listener>(event: T, listener: Listener[T]): boolean {
    let list: unknown[] | undefined = undefined

    switch (event) {
      case 'onBeforeRequest':
        list = this.listeners.beforeRequest
        break
      case 'onBeforeSendHeaders':
        list = this.listeners.beforeSendHeaders
        break
      case 'onHeadersReceived':
        list = this.listeners.headersReceived
        break
    }

    if (list) {
      const index = list.indexOf(listener)
      if (index > -1) {
        list.splice(index, 1)
        return true
      }
    }

    return false
  }

  /**
   * 清空监听器
   */
  public emptyListeners() {
    this.listeners.beforeRequest.length = 0
    this.listeners.beforeSendHeaders.length = 0
    this.listeners.headersReceived.length = 0
  }

  /**
   * 销毁
   */
  public destroy() {
    this.emptyListeners()
    this.sess.webRequest.onBeforeRequest(null)
    this.sess.webRequest.onBeforeSendHeaders(null)
    this.sess.webRequest.onHeadersReceived(null)
  }

  /**
   * The user agent for this session.
   */
  public get userAgent(): string {
    return this.sess.getUserAgent()
  }

  /**
   * Overrides the `userAgent` for this session.
   * This doesn't affect existing `WebContents`, and each `WebContents` can use
   * `webContents.setUserAgent` to override the session-wide user agent.
   */
  public set userAgent(userAgent: string) {
    this.sess.setUserAgent(userAgent)
  }
}
