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
  private beforeRequestList: Listener['onBeforeRequest'][] = []

  private beforeSendHeadersList: Listener['onBeforeSendHeaders'][] = []

  private headersReceivedList: Listener['onHeadersReceived'][] = []

  /**
   * Sessions 助手
   * @param sess
   */
  constructor(public sess: Electron.Session, urls: string[] = []) {
    this.sess.webRequest.onBeforeRequest({ urls }, (details, callback) => {
      let _callback = {}
      for (const beforeRequest of this.beforeRequestList) {
        _callback = { ..._callback, ...beforeRequest(details) }
      }
      callback(_callback)
    })

    this.sess.webRequest.onBeforeSendHeaders({ urls }, (details, callback) => {
      let _callback = {}
      for (const beforeSendHeaders of this.beforeSendHeadersList) {
        _callback = { ..._callback, ...beforeSendHeaders(details) }
      }
      callback(_callback)
    })

    this.sess.webRequest.onHeadersReceived({ urls }, (details, callback) => {
      let _callback = {}
      for (const headersReceived of this.headersReceivedList) {
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
  public register<T extends keyof Listener>(event: T, listener: Listener[T]): () => void {
    switch (event) {
      case 'onBeforeRequest':
        this.beforeRequestList.push(listener as Listener['onBeforeRequest'])
        break
      case 'onBeforeSendHeaders':
        this.beforeSendHeadersList.push(listener as Listener['onBeforeSendHeaders'])
        break
      case 'onHeadersReceived':
        this.headersReceivedList.push(listener as Listener['onHeadersReceived'])
        break
    }
    // returns a cancellation function
    return () => {
      this.unregister(event, listener)
    }
  }

  private cancellationMethod(list: any[], listener: any): boolean {
    const index = list.indexOf(listener)
    if (index > -1) {
      list.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * 取消注册
   * @param event
   * @param listener
   * @returns 是否成功
   */
  public unregister<T extends keyof Listener>(event: T, listener: Listener[T]): boolean {
    if (event === 'onBeforeRequest') {
      return this.cancellationMethod(this.beforeRequestList, listener)
    } else if (event === 'onBeforeSendHeaders') {
      return this.cancellationMethod(this.beforeSendHeadersList, listener)
    } else if (event === 'onHeadersReceived') {
      return this.cancellationMethod(this.headersReceivedList, listener)
    }
    return false
  }

  public emptyListener() {
    this.beforeRequestList = []
    this.beforeSendHeadersList = []
    this.headersReceivedList = []
  }

  public destroy() {
    this.emptyListener()
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
