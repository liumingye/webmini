import { addStyle, whenDom } from '@/utils'
import { ipcRenderer } from 'electron'
import style from './style.less?inline'

let unloadStyle: null | (() => void)
let abortPromise: null | (() => void)

/**
 * 视频播放结束
 */
const ended = () => {
  // 跳过充电鸣谢
  setTimeout(() => {
    const jumpButton = document.querySelector('.bilibili-player-electric-panel-jump') as HTMLElement
    jumpButton?.click()
  }, 100)
}

/**
 * 从app层面把 上、下 按键传进来，方便播放器控制音量
 * @param _ev
 * @param arg
 */
const changeVolume = (_ev: Electron.IpcRendererEvent, arg: 'up' | 'down') => {
  const event = new KeyboardEvent('keydown', {
    keyCode: arg === 'up' ? 38 : 40,
    bubbles: true,
  })
  document.dispatchEvent(event)
}

/**
 * 播放器加载完成
 */
const playerReady = () => {
  document.querySelector('video')?.addEventListener('ended', ended)
  ipcRenderer.on('change-volume', changeVolume)
  abortPromise && abortPromise()
}

const module = {
  start: () => {
    module.stop()
    whenDom(
      ['.bilibili-player-video-web-fullscreen', '.squirtle-video-pagefullscreen'],
      '.bilibili-player-video-control-wrap,#bilibili-player',
    ).then(({ promise, abort }) => {
      abortPromise = abort
      promise.then(
        () => {
          playerReady()
        },
        () => {
          abortPromise = null
          document.querySelector('video')?.removeEventListener('ended', ended)
          ipcRenderer.off('change-volume', changeVolume)
        },
      )
    })
    // 预先加载全屏样式
    document.body.classList.add('player-mode-webfullscreen', 'player-fullscreen-fix')
    const styleEntry = addStyle(style)
    unloadStyle = styleEntry.unload
  },

  stop: () => {
    // 断开 observer
    abortPromise && abortPromise()
    document.body.classList.remove('player-mode-webfullscreen', 'player-fullscreen-fix')
    unloadStyle && unloadStyle()
  },
}

export default module
