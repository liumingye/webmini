import { addStyle } from '../../utils'
import style from './style.less'

let unloadStyle: () => void

const module = {
  start: () => {
    const styleEntry = addStyle(style)
    unloadStyle = styleEntry.unload
  },

  stop: () => {
    unloadStyle && unloadStyle()
  },
}

export default module
