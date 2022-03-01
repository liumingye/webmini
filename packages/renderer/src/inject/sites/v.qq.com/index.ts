import { is } from './utils'
import { adblock, video } from './modules'

export default () => {
  const location = window.location
  const simpleHref = location.hostname + location.pathname
  // 脚本开始
  console.log('脚本注入成功！！！')
  adblock.start()
  if (is.video(simpleHref)) {
    video.start()
  }
}
