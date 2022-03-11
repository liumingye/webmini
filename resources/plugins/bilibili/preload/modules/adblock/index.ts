import style from './style.less?inline'

const addStyle = (window as any).utils.addStyle

let unloadStyle: () => void

const module = {
  start: (): void => {
    module.stop()
    const styleEntry = addStyle(style)
    unloadStyle = styleEntry.unload
  },

  stop: (): void => {
    unloadStyle && unloadStyle()
  },
}

export default module
