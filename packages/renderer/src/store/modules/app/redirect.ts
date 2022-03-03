export default () => {
  const _URL = new URL(url)
  // 视频
  const vid = getVidWithP(_URL.pathname)
  if (vid) {
    if (_URL.hostname === 'm.bilibili.com') {
      // historyStore.replace(videoUrlPrefix + vid)
      historyStore.pop()
      this.webview.loadURL(videoUrlPrefix + vid, {
        userAgent: userAgent.desktop,
      })
    }
    if (vid !== lastId) {
      getPartOfVideo(vid)
      lastId = vid
    }
    this.disableDanmakuButton = false
    this.autoHideBar = true
    if (this.windowID.selectPartWindow) {
      ipc.sendTo(this.windowID.selectPartWindow, 'url-changed', url)
    }
    return
  }

  // 番剧
  const bvid = getBvid(_URL.pathname)
  if (bvid) {
    if (_URL.hostname === 'm.bilibili.com') {
      // historyStore.replace(bangumiUrlPrefix + bvid)
      historyStore.pop()
      this.webview.loadURL(bangumiUrlPrefix + bvid, {
        userAgent: userAgent.desktop,
      })
    }
    if (bvid !== lastId) {
      getPartOfBangumi(bvid)
      lastId = bvid
    }
    this.disableDanmakuButton = false
    this.autoHideBar = true
    return
  }

  // test
  // https://v.qq.com/x/cover/pld2wqk8kq044nv/r0035yfoa2m.html
  // https://m.v.qq.com/x/m/play?cid=u496ep9wpw4rkno&vid=
  // https://m.v.qq.com/cover/m/mzc00200jtxd9ap.html?vid=d0042iplesm
  // https://m.v.qq.com/x/play.html?cid=od1kjfd56e3s7n7
  const cidArr = /(cid=|\/)([A-Za-z0-9]{15})/.exec(_URL.pathname + _URL.search)
  // window.app.logger.debug(cidArr)
  if (cidArr) {
    const vidArr = /(vid=|\/)([A-Za-z0-9]{11})(\.|$|&)/.exec(_URL.pathname + _URL.search)
    const cid = cidArr[2]
    const vid = vidArr ? vidArr[2] : ''
    if (_URL.hostname === 'm.v.qq.com') {
      historyStore.pop()
      const url = ref(`https://v.qq.com/x/cover/${cid}`)
      if (vid !== '') {
        url.value += `/${vid}`
      }
      url.value += `.html`
      this.webview.loadURL(url.value, {
        userAgent: userAgent.desktop,
      })
    }
    if (cid + vid !== lastId) {
      getPartOfQQ(cid, vid)
      lastId = cid + vid
      console.log(lastId)
    }
    this.disableDanmakuButton = true
    this.disablePartButton = true
    this.autoHideBar = true
    return
  }

  this.disablePartButton = true

  // 直播
  if (_URL.hostname === 'live.bilibili.com') {
    const live = /^\/(h5\/||blanc\/)?(\d+).*/.exec(_URL.pathname)
    if (live) {
      if (live[1] === 'h5/') {
        // historyStore.replace(liveUrlPrefix + live[2])
        historyStore.pop()
        this.webview.loadURL(liveUrlPrefix + live[2], {
          userAgent: userAgent.desktop,
        })
      }
      this.disableDanmakuButton = false
      this.autoHideBar = true
      return
    }
  }

  this.disableDanmakuButton = true
  this.autoHideBar = false

  // 登录页
  if (url.indexOf('//passport.bilibili.com/login') >= 0) {
    this.webview.loadURL(url, {
      userAgent: userAgent.desktop,
    })
    return
  }

  this.webview.setUserAgent(new Site(url).getUserAgent())
}
