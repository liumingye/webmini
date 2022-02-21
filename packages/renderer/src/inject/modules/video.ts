import { addStyle } from '../utils'
import { ipcRenderer } from 'electron'

let removeStyle: () => void

const style = `.bilibili-player-video-sendbar,.bpx-player-sending-area{display:none!important}
#bilibili-player{width:100vw!important;height:100vh!important;position:fixed!important;z-index:100000!important;left:0!important;top:0!important}
@media screen and (max-width: 480px), (max-height: 360px) {
  .bilibili-player.mode-miniscreen.bilibili-player .bilibili-player-area .bilibili-player-video-control, .bilibili-player.mode-miniscreen.bilibili-player .bilibili-player-area .bilibili-player-video-control-mask, .bilibili-player.mode-miniscreen.bilibili-player .bilibili-player-area .bilibili-player-video-wrap .bilibili-player-video-float-lastplay, .bilibili-player.mode-miniscreen.bilibili-player .bilibili-player-area .bilibili-player-video-wrap .bilibili-player-video-float-movie-wrp, .bilibili-player.mode-miniscreen.bilibili-player .bilibili-player-area .bilibili-player-video-wrap .bilibili-player-video-float-panel-wrp, .bilibili-player.mode-miniscreen[class*=mode-] .bilibili-player-area .bilibili-player-video-control, .bilibili-player.mode-miniscreen[class*=mode-] .bilibili-player-area .bilibili-player-video-control-mask, .bilibili-player.mode-miniscreen[class*=mode-] .bilibili-player-area .bilibili-player-video-wrap .bilibili-player-video-float-lastplay, .bilibili-player.mode-miniscreen[class*=mode-] .bilibili-player-area .bilibili-player-video-wrap .bilibili-player-video-float-movie-wrp, .bilibili-player.mode-miniscreen[class*=mode-] .bilibili-player-area .bilibili-player-video-wrap .bilibili-player-video-float-panel-wrp{display:flex!important;}
}`

const changeVolume = (ev: Electron.IpcRendererEvent, arg: 'up' | 'down') => {
  const event = new KeyboardEvent('keydown', {
    keyCode: arg === 'up' ? 38 : 40,
    bubbles: true,
  })
  document.dispatchEvent(event)
}

// 监控全屏按钮出现
const observer = new MutationObserver((mutations) => {
  mutations.forEach(({ addedNodes }) => {
    if (addedNodes.length === 0) return
    const node = addedNodes[0] as HTMLElement
    if (
      /(bilibili-player-video-web-fullscreen|squirtle-video-pagefullscreen)/.test(node.className)
    ) {
      node.click()
      // 从app层面把 上、下 按键传进来，方便播放器控制音量
      ipcRenderer.on('change-volume', changeVolume)
      // 用户按了老板键，停止播放视频
      // ipcRenderer.on("hide-hide-hide", () => {
      //   const player = document.querySelector(".bilibili-player-video");
      //   const playButton = document.querySelector(
      //     ".bilibili-player-video-btn-start"
      //   );
      //   // 只有当视频处在播放状态时才click一下来停止播放，如果本来就停止了就别点了
      //   if (
      //     player &&
      //     !Array.from(playButton.classList).includes("video-state-pause")
      //   ) {
      //     player.click();
      //   }
      // });
      observer.disconnect()
    }
  })
})

const module = {
  start: () => {
    // 预先加载全屏样式
    document.body.classList.add('player-mode-webfullscreen', 'player-fullscreen-fix')
    removeStyle = addStyle(style)
    // 隐藏全屏播放器（在某些情况下会出现）的滚动条
    document.body.style.overflow = 'hidden'
    const target = document.querySelector('.bilibili-player-video-control-wrap,#bilibili-player')
    target &&
      observer.observe(target, {
        childList: true,
        subtree: true,
      })
  },

  stop: () => {
    // 断开 observer
    observer.disconnect()
    ipcRenderer.off('change-volume', changeVolume)
    document.body.classList.remove('player-mode-webfullscreen', 'player-fullscreen-fix')
    document.body.style.overflow = ''
    removeStyle && removeStyle()
  },
}

export default module
