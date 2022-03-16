import type { addData } from '../main/plugins/data'
import type { addHook } from '../main/plugins/hook'
import type { WebContents } from 'electron'
import type Net from '../common/net'
import type { CommonWindow } from '../main/windows/common'

export type PluginDataProvider = (...args: any[]) => void | Promise<void>

export interface PluginHookProvider {
  /** 事件发生前执行 */
  before?: (...args: any[]) => void | Promise<void>
  /** 事件发生后执行 */
  after?: (...args: any[]) => void | Promise<void>
}

/** 插件初始化时的传入参数, 可以解构并调用 */
export interface PluginLoadParameters {
  addData: typeof addData
  addHook: typeof addHook
  application: {
    mainWindow: {
      send: CommonWindow['send'] | undefined
    }
    selectPartWindow: {
      send: CommonWindow['send'] | undefined
    }
  }
  webContents: WebContents
  net: Net
}

export interface PluginUnloadParameters {
  webContents: WebContents
}

/** 插件基本信息 */
export interface PluginMinimalData {
  /** 插件名称 */
  name: string
  preloads: string[]
  /** 初始化函数, 可在其中注册数据, 添加代码注入等 */
  load: (params: PluginLoadParameters) => void | Promise<void>
  unload: (params: PluginUnloadParameters) => void | Promise<void>
  /** 设置匹配的URL, 不匹配则不运行此组件 */
  urlInclude?: (string | RegExp)[]
  /** 设置不匹配的URL, 不匹配则不运行此组件, 优先级高于`urlInclude` */
  urlExclude?: (string | RegExp)[]
}
type PartialRequired<Target, Props extends keyof Target> = Target & {
  [P in Props]-?: Target[P]
}
export type PluginMetadata = PartialRequired<PluginMinimalData, 'name'>

/**
 * 插件管理器配置
 * @param baseDir 插件安装目录
 * @param registry 插件下载源 即 npm 源
 * @export
 * @interface AdapterHandlerOptions
 */
export interface AdapterHandlerOptions {
  baseDir: string
  registry?: string
}

/**
 * 插件信息, 对应 package.json
 * @export
 * @interface AdapterInfo
 */

export interface LocalPluginInfo {
  // 插件名称
  name: string
  // 可读插件名称
  displayName: string
  // 开始页
  start: string
  // 图标
  icon: string
  // 状态
  status?: PluginStatus
}

export interface AdapterInfo {
  // 插件名称
  name: string
  // 可读插件名称
  pluginName: string
  // 描述
  description: string
  // 作者
  author: string
  // 入口文件
  main: string
  // 版本
  version: string
  // 本地插件信息
  local?: LocalPluginInfo
}

export enum PluginStatus {
  INSTALLING = 'INSTALLING',
  INSTALLING_COMPLETE = 'INSTALLING_COMPLETE',
  INSTALL_FAIL = 'INSTALL_FAIL',
  UNINSTALLING = 'UNINSTALLING',
  UNINSTALL_FAIL = 'UNINSTALL_FAIL',
  UNINSTALL_COMPLETE = 'UNINSTALL_COMPLETE',
}
