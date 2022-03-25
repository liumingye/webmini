/** 执行数据注入, 参数将由插件注册者提供 */
import type { PluginDataProvider } from '~/interfaces/plugin'

interface DataItems {
  /** 标识ID */
  key: string
  registered: boolean
  /** 数据对象 */
  data: any[]
  loaded: boolean
  providers: PluginDataProvider[]
}

const pluginDataMap = new Map<string, DataItems[]>()

/**
 * 注册数据, 允许其他代码向其中添加数据
 * @param name 插件名字
 * @param key 标识ID
 * @param data 提供的数据对象, 注入者将把数据添加到其中
 */
export const registerData = (name: string, key: string, ...data: any[]): void => {
  if (!pluginDataMap.has(name)) {
    pluginDataMap.set(name, [])
  }

  const items = pluginDataMap.get(name)

  if (!items) return

  const item = items.find((x) => x.key === key)

  if (!item) {
    pluginDataMap.set(name, [
      ...items,
      {
        key,
        registered: true,
        data,
        loaded: false,
        providers: [],
      },
    ])
    return
  }

  const { registered } = item
  if (registered) {
    return
  }

  item.registered = true
  item.data = data
}

/**
 * 向由`key`指定的对象注入数据
 * @param name 插件名字
 * @param key 标识ID
 * @param provider 数据注入的配置对象
 */
export const addData = (name: string, key: string, provider: PluginDataProvider): void => {
  if (!pluginDataMap.has(name)) {
    pluginDataMap.set(name, [])
  }

  const items = pluginDataMap.get(name)

  if (!items) return

  const item = items.find((x) => x.key === key)

  if (!item) {
    pluginDataMap.set(name, [
      ...items,
      {
        key,
        registered: false,
        data: [],
        loaded: false,
        providers: [provider],
      },
    ])
    return
  }

  const { providers, registered, data } = item

  providers.push(provider)

  if (registered) {
    provider(...data)
  }
}

/**
 * 从由`key`指定的对象获取数据, 未注册时返回空数组
 * @param name 插件名字
 * @param key 标识ID
 */
export const getData = (name: string, key: string) => {
  if (pluginDataMap.has(name)) {
    const items = pluginDataMap.get(name)
    if (!items) {
      return []
    }
    const item = items.find((x) => x.key === key)
    if (!item) {
      return []
    }
    const { data, registered, loaded, providers } = item
    if (registered) {
      if (!loaded) {
        providers.forEach((p) => p(...data))
        item.loaded = true
      }
      return data
    }
  }
  return []
}

/**
 * 注册并获取数据 (`registerData`+`getData`)
 * @param key 标识ID
 * @param data 提供的数据对象, 注入者将把数据添加到其中
 */
export const registerAndGetData = <T extends any[]>(name: string, key: string, ...data: T) => {
  registerData(name, key, ...data)
  return getData(name, key) as T
}

/**
 * 清理插件数据
 * @param name
 */
export const removeData = (name: string): boolean => {
  return pluginDataMap.delete(name)
}

/**
 * 销毁数据
 */
export const destroyData = (): void => {
  pluginDataMap.clear()
}
