import style from './style.less?inline'

const addStyle = (window as any).utils.addStyle

let unloadStyle: () => void

const module = {
  start: () => {
    module.stop()
    const styleEntry = addStyle(style)
    unloadStyle = styleEntry.unload
    document.body.classList.add('player-full-win', 'hide-aside-area')
  },

  stop: () => {
    unloadStyle && unloadStyle()
    document.body.classList.remove('player-full-win', 'hide-aside-area')
  },
}

export default module
