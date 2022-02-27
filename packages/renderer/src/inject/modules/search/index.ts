import { addStyle } from '../../utils'
import style from './style.less?inline'

let unloadStyle: () => void

const searchObserver = new MutationObserver((mutations) => {
  mutations.forEach(({ addedNodes }) => {
    if (addedNodes.length === 0) return
    const node = addedNodes[0] as HTMLElement
    if (node.className === 'v-dialog') {
      const cancel = document.querySelector('.open-app-dialog-btn.cancel') as HTMLElement
      cancel?.click()
      searchObserver.disconnect()
    }
  })
})

const module = {
  start: () => {
    module.stop()
    // 打开app弹窗自动点击取消
    const styleEntry = addStyle(style)
    unloadStyle = styleEntry.unload
    searchObserver.observe(document.body, {
      childList: true,
    })
  },

  stop: () => {
    // 断开 observer
    searchObserver.disconnect()
    unloadStyle && unloadStyle()
  },
}

export default module
