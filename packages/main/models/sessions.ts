interface Listener {
  onBeforeRequest: (details: Electron.OnBeforeRequestListenerDetails) => Electron.Response
  onBeforeSendHeaders: (
    details: Electron.OnBeforeSendHeadersListenerDetails,
  ) => Electron.BeforeSendResponse
  onHeadersReceived: (
    details: Electron.OnHeadersReceivedListenerDetails,
  ) => Electron.HeadersReceivedResponse
}

export class Sessions {
  private beforeRequestList: Listener['onBeforeRequest'][] = []

  private beforeSendHeadersList: Listener['onBeforeSendHeaders'][] = []

  private headersReceivedList: Listener['onHeadersReceived'][] = []

  constructor(public sess: Electron.Session) {
    this.sess.webRequest.onBeforeRequest((details, callback) => {
      let _callback = {}
      for (const beforeRequest of this.beforeRequestList) {
        _callback = { ..._callback, ...beforeRequest(details) }
      }
      callback(_callback)
    })

    this.sess.webRequest.onBeforeSendHeaders((details, callback) => {
      let _callback = {}
      for (const beforeSendHeaders of this.beforeSendHeadersList) {
        _callback = { ..._callback, ...beforeSendHeaders(details) }
      }
      callback(_callback)
    })

    this.sess.webRequest.onHeadersReceived((details, callback) => {
      let _callback = {}
      for (const headersReceived of this.headersReceivedList) {
        _callback = { ..._callback, ...headersReceived(details) }
      }
      callback(_callback)
    })
  }

  public register<T extends keyof Listener>(event: T, listener: Listener[T]) {
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

  private cancellationMethod(list: any[], listener: any) {
    const index = list.indexOf(listener)
    if (index > -1) list.splice(index, 1)
  }

  public unregister<T extends keyof Listener>(event: T, listener: Listener[T]) {
    if (event === 'onBeforeRequest') {
      this.cancellationMethod(this.beforeRequestList, listener)
    } else if (event === 'onBeforeSendHeaders') {
      this.cancellationMethod(this.beforeSendHeadersList, listener)
    } else if (event === 'onHeadersReceived') {
      this.cancellationMethod(this.headersReceivedList, listener)
    }
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
}
