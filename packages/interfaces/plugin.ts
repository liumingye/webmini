import type { WebContents } from 'electron'
import type axios from 'axios'
import type { ShallowRef } from 'vue'
import type { NetApi } from './net'
import type { CommonWindowApi } from './window'
import type { StorageServiceApi } from './storage'
import type { CookiesApi } from './cookies'

export type { WebContents }

/** 插件初始化时的传入参数, 可以解构并调用 */
export interface PluginApiParameters {
  application: {
    mainWindow: CommonWindowApi
    selectPartWindow: CommonWindowApi
  }
  net: NetApi
  db: StorageServiceApi
  axios: typeof axios
  cookies: CookiesApi
}

export type ThemeColor = {
  bg?: string
  text?: string
}

export type Theme = {
  light?: ThemeColor
  dark?: ThemeColor
}

export type UserAgent = {
  mobile?: (string | RegExp)[]
  desktop?: (string | RegExp)[]
}

export type WindowType = {
  mini?: (string | RegExp)[]
}

export type Search = {
  link: string
  placeholder?: string
  links?: {
    test: RegExp
    link: string
  }[]
}

export type Nav = Record<
  string,
  {
    name: string
    url: string
  }[]
>

export type Replace = {
  search: string
  replace: string
}[]

export type WebNav = {
  search?: Search
  nav?: Nav
  replace?: Replace
}

export type UrlChangeData = {
  url: URL
}

/** 插件基本信息 */
export interface PluginMinimalData {
  /** 插件名称 */
  name?: string
  /** preloads */
  preloads?: string[]

  /** 初始化函数, 可在其中注册数据, 添加代码注入等 */
  load?: () => void | Promise<void>
  /** 卸载函数 */
  unload?: () => void | Promise<void>

  /** 设置匹配的URL, 不匹配则不运行此组件 */
  urlInclude?: (string | RegExp)[]
  /** 设置不匹配的URL, 不匹配则不运行此组件, 优先级高于`urlInclude` */
  urlExclude?: (string | RegExp)[]

  // 数据
  themeColor?: Theme
  userAgent?: UserAgent
  windowType?: WindowType
  webNav?: WebNav

  // 事件
  onUrlChanged?(data: UrlChangeData, webContents: WebContents): void | Promise<void>
}

type PartialRequired<Target, Props extends keyof Target> = Target & {
  [P in Props]-?: Target[P]
}

export type PluginMetadata = PartialRequired<PluginMinimalData, 'name'>

/**
 * 插件管理器配置
 * @param baseDir 插件安装目录
 * @export
 * @interface AdapterHandlerOptions
 */
export interface AdapterHandlerOptions {
  baseDir: string
}

/** 本地插件信息 */
export interface LocalPluginInfo {
  /** 插件名称 */
  readonly name: string
  /** 可读插件名称 */
  readonly displayName: string
  /** 开始页 */
  readonly start: string
  /** 图标 */
  icon?: string | ShallowRef<any>
  /** 版本 */
  readonly version: string
  /** 状态 */
  status?: PluginStatus
}

/**
 * 在线插件信息
 * https://gitee.com/liumingye/webmini-database/blob/master/plugins.json
 * @export
 * @interface AdapterInfo
 */
export interface AdapterInfo {
  /** 插件名称 */
  readonly name: string
  /** 可读插件名称 */
  readonly pluginName: string
  /** 描述 */
  readonly description: string
  /** 作者 */
  readonly author: string
  /** 版本 */
  readonly version: string
  /** 本地插件信息 */
  local?: LocalPluginInfo
}

export enum PluginStatus {
  /** 安装中 */
  INSTALLING = 'INSTALLING',
  /** 安装完成 */
  INSTALLING_COMPLETE = 'INSTALLING_COMPLETE',
  /** 安装失败 */
  INSTALL_FAIL = 'INSTALL_FAIL',
  /** 卸载中 */
  UNINSTALLING = 'UNINSTALLING',
  /** 卸载失败 */
  UNINSTALL_FAIL = 'UNINSTALL_FAIL',
  /** 卸载完成 */
  UNINSTALL_COMPLETE = 'UNINSTALL_COMPLETE',
  /** 卸载完成 */
  UPGRADE = 'UPGRADE',
}
