/** 针对某种事件进行的代码注入 */
import { PluginHookProvider } from '~/interfaces/plugin'

const pluginHookMap = new Map<
  string,
  {
    providers: PluginHookProvider[]
  }
>()

/**
 * 向由`key`指定的目标注入代码
 * @param key 标识ID
 * @param provider 代码注入的配置对象
 */
export const addHook = (key: string, provider: PluginHookProvider): void => {
  if (pluginHookMap.has(key)) {
    const map = pluginHookMap.get(key)
    if (!map) return
    map.providers.push(provider)
  } else {
    pluginHookMap.set(key, {
      providers: [provider],
    })
  }
}

/**
 * 根据`key`获取已添加的代码注入
 * @param key 标识ID
 * @param fixedArgs 运行代码注入函数时, 传入的固定参数
 */
export const getHook = (key: string, ...fixedArgs: any[]) => {
  if (pluginHookMap.has(key)) {
    const item = pluginHookMap.get(key)
    if (!item) return
    return {
      before: async (...args: any[]) =>
        Promise.all(item.providers.map((p) => p.before?.(...fixedArgs.concat(args)))),
      after: async (...args: any[]) =>
        Promise.all(item.providers.map((p) => p.after?.(...fixedArgs.concat(args)))),
    }
  }
  return {
    before: async () => Promise.all<void>([]),
    after: async () => Promise.all<void>([]),
  }
}

export const clearHook = (): void => {
  pluginHookMap.clear()
}
