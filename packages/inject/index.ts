// import { ipcRenderer } from 'electron'
// import bilibili from '@/sites/bilibili.com'
// import vqq from '@/sites/v.qq.com'
import { addStyle, whenDom } from '@/utils'
;(window as any).utils = { addStyle, whenDom }
console.log(1)
console.log(window.utils)

// const applyScript = () => {
//   const location = window.location
//   if (location.hostname.indexOf('.bilibili.com') >= 0) {
//     bilibili()
//   } else if (location.hostname.indexOf('v.qq.com') >= 0) {
//     vqq()
//   }
// }

// window.addEventListener('DOMContentLoaded', () => {
//   applyScript()
//   ipcRenderer.on('load-commit', () => {
//     applyScript()
//   })
// })
