import { addStyle } from '../../utils'
import { ipcRenderer } from 'electron'
import style from './style.less'

let unloadStyle: () => void

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
      // 跳过充电鸣谢
      document.querySelector('video')?.addEventListener('ended', () => {
        setTimeout(() => {
          const jumpButton = document.querySelector(
            '.bilibili-player-electric-panel-jump',
          ) as HTMLElement
          jumpButton?.click()
        }, 100)
      })
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
    const styleEntry = addStyle(style)
    unloadStyle = styleEntry.unload
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
    unloadStyle && unloadStyle()
  },
}

export default module
