import { ipcRenderer } from 'electron'
import { is } from './utils'
import { search, adblock, video, home, live } from './modules'

const addStyle = (window as any).utils.addStyle

const applyScript = () => {
  console.log('applyScript - bilibili')
  console.log('applyScript')
  const location = window.location
  const simpleHref = location.hostname + location.pathname
  const liveId = /live\.bilibili\.com\/(\d+)/.exec(simpleHref)
  if (liveId) {
    location.href = `https://live.bilibili.com/blanc/${liveId[1]}?liteVersion=true`
  }
  // 脚本开始
  console.log('脚本注入成功！！！')
  adblock.start()
  // 普通视频页：自动最大化播放器
  if (is.video(simpleHref)) {
    video.start()
  }
  // 动态页重做样式
  else if (is.trends(simpleHref)) {
    addStyle(
      '#internationalHeader{display:none;}' +
        '.home-page .home-container .home-content .center-panel{padding:0 8px;box-sizing:border-box;margin:0!important;}' +
        '#bili-header-m,.left-panel,.right-panel,.center-panel>.section-block,.sticky-bar{ display:none!important}' +
        '.home-content,.center-panel{width:100%!important;}' +
        '.card,.feed-card{min-width:0!important;}',
    )
  }

  // 直播使用桌面版 HTML5 直播播放器
  else if (is.live(simpleHref)) {
    live.start()
  } else if (is.login(simpleHref)) {
    addStyle(
      'body{overflow:hidden}#internationalHeader,.international-footer,.top-banner,.qrcode-tips,.title-line,.app-link{display: none!important}',
    )
    document.title = '登录'
  } else if (is.search(simpleHref + location.search)) {
    search.start()
  } else if (is.home(simpleHref)) {
    home.start()
  }
}

window.addEventListener(
  'DOMContentLoaded',
  () => {
    applyScript()
    ipcRenderer.on('load-commit', () => {
      applyScript()
    })
  },
  { once: true, passive: true },
)
