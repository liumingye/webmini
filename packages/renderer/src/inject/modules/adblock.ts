import { addStyle } from '../utils'

let removeStyle: () => void

const module = {
  start: () => {
    removeStyle = addStyle(
      `.launch-app-btn,.bili-app-link-container,.h5-download-bar{display:none}`,
    )
  },

  stop: () => {
    removeStyle && removeStyle()
  },
}

export default module
