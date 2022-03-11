import style from './style.less?inline'

const addStyle = (window as any).utils.addStyle

let unloadStyle: () => void

const module = {
  start: (): void => {
    module.stop()
    const styleEntry = addStyle(style)
    unloadStyle = styleEntry.unload
    document.body.classList.add('player-full-win', 'hide-aside-area')
  },

  stop: (): void => {
    unloadStyle && unloadStyle()
    document.body.classList.remove('player-full-win', 'hide-aside-area')
  },
}

export default module
