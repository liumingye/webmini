import style from './style.less?inline'

const addStyle = (window as any).utils.addStyle

let unloadStyle: () => void

const module = {
  start: () => {
    module.stop()
    const styleEntry = addStyle(style)
    unloadStyle = styleEntry.unload
  },

  stop: () => {
    unloadStyle && unloadStyle()
  },
}

export default module
