import { addStyle, whenDom } from '@/utils'
import { ipcRenderer } from 'electron'
import { withPrototype } from '../common'

declare global {
  interface Window {
    utils: Record<string, unknown>
  }
}

// 提供给插件 preload 的公共函数
window.utils = { addStyle, whenDom, ipcRenderer: withPrototype(ipcRenderer) }
