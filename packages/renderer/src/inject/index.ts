import { is, addStyle } from './utils'
import { search, adblock, video } from './modules'
import { ipcRenderer } from 'electron'

declare global {
  interface Window {
    EmbedPlayer: any
  }
}

const liveId = /\/\/live\.bilibili\.com\/(\d+)/.exec(window.location.href)
if (liveId) {
  window.location.href = `https://live.bilibili.com/blanc/${liveId[1]}?liteVersion=true`
}

const applyStyle = () => {
  // 脚本停止
  adblock.stop()
  video.stop()
  search.stop()
  // 脚本开始
  console.log('脚本注入成功！！！')
  adblock.start()
  // 普通视频页：自动最大化播放器
  if (is.video(window.location.pathname)) {
    video.start()
  }
  // 动态页重做样式
  else if (is.trends(window.location.href)) {
    addStyle(
      '#internationalHeader{display:none;}' +
        '.home-page .home-container .home-content .center-panel{padding:0 8px;box-sizing:border-box;margin:0!important;}' +
        '#bili-header-m,.left-panel,.right-panel,.center-panel>.section-block,.sticky-bar{ display:none!important}' +
        '.home-content,.center-panel{width:100%!important;}' +
        '.card{min-width: 0!important;}',
    )
  }

  // 直播使用桌面版 HTML5 直播播放器
  else if (is.live(window.location.href)) {
    // 通过查询 HTML5 播放器 DIV 来判断页面加载
    if (document.querySelector('.bp-no-flash-tips')) {
      // 切换 HTML5 播放器
      window.EmbedPlayer.loader()
    } else {
      // 全屏播放器并隐藏聊天栏
      document.getElementsByTagName('body')[0].classList.add('player-full-win', 'hide-aside-area')
      addStyle(
        // 隐藏聊天栏显示按钮
        '.aside-area-toggle-btn{display: none!important}' +
          // 隐藏全屏播放器（在某些情况下会出现）的滚动条
          'body{overflow: hidden;}' +
          // 移除看板娘
          '#my-dear-haruna-vm{display: none!important}' +
          // 移除问题反馈
          '.web-player-icon-feedback{display: none!important}' +
          '#sidebar-vm{display: none!important}',
      )
    }
  } else if (is.login(window.location.href)) {
    addStyle(
      '#internationalHeader,.international-footer,.top-banner,.qrcode-tips,.title-line{display: none!important}',
    )
  } else if (is.search(window.location.href)) {
    search.start()
  }
}

window.addEventListener('DOMContentLoaded', () => {
  applyStyle()
  ipcRenderer.on('load-commit', () => {
    applyStyle()
  })
})
