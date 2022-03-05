import { PluginMetadata } from '@/store/modules/plugin/types'
// import { useAppStore, useHistoryStore } from '@/store'
// import { userAgent } from '@/config/constant'

// const last = reactive({
//   vid: '',
// })

export const plugin: PluginMetadata = {
  name: 'vqq',
  displayName: '腾讯视频',
  urlInclude: ['v.qq.com', 'm.v.qq.com'],
  setup: ({ addHook, addData }) => {
    addData('userAgent', (presetBase: Record<string, string[]>) => {
      presetBase.mobile = ['m.v.qq.com', 'm.film.qq.com']
    })
    addData('windowType', (presetBase: Record<string, (string | RegExp)[]>) => {
      presetBase.mini = [/(m\.|)v\.qq\.com(.*?)(\/cover|\/play)/]
    })
    addHook('updateUrl', {
      after: () => {
        console.log('腾讯视频')
      },
      // after: async ({ url }: { url: URL }) => {
      // const appStore = useAppStore()
      // const historyStore = useHistoryStore()
      // },
    })
  },
}
