import { addHook, getHook } from './hook'

/** 插件初始化时的传入参数, 可以解构并调用 */
export interface PluginSetupParameters {
  addHook: typeof addHook
  getHook: typeof getHook
}

/** 插件基本信息 */
export interface PluginMinimalData {
  /** 插件名称 */
  name: string
  /** 显示名称 */
  displayName: string
  /** 初始化函数, 可在其中注册数据, 添加代码注入等 */
  setup: (params: PluginSetupParameters) => void | Promise<void>
  /** 设置匹配的URL, 不匹配则不运行此组件 */
  urlInclude?: (string | RegExp)[]
  /** 设置不匹配的URL, 不匹配则不运行此组件, 优先级高于`urlInclude` */
  urlExclude?: (string | RegExp)[]
}
type PartialRequired<Target, Props extends keyof Target> = Target & {
  [P in Props]-?: Target[P]
}
export type PluginMetadata = PartialRequired<PluginMinimalData, 'displayName'>

export interface PluginStateTypes {
  url: string
  plugins: PluginMinimalData[]
}
