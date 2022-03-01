import { addStyle } from '@/utils'
import { ipcRenderer } from 'electron'
import style from './style.less?inline'

let unloadStyle: null | (() => void)

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
  document.querySelector('video')?.dispatchEvent(event)
}

const module = {
  start: () => {
    module.stop()
    // 预先加载全屏样式
    document.documentElement.classList.add('txp_html_fullscreen', 'txp_html_barrage_on')
    const styleEntry = addStyle(style)
    unloadStyle = styleEntry.unload
    ipcRenderer.on('change-volume', changeVolume)
  },

  stop: () => {
    document.documentElement.classList.remove('txp_html_fullscreen', 'txp_html_barrage_on')
    unloadStyle && unloadStyle()
    ipcRenderer.off('change-volume', changeVolume)
  },
}

export default module
