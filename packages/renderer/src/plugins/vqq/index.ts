import { PluginMetadata } from '@/store/modules/plugin/types'
// import { useAppStore, useHistoryStore } from '@/store'
// import { userAgent } from '@/config/constant'

// const last = reactive({
//   vid: '',
// })

const updateUrl = {
  // after: async ({ url }: { url: URL }) => {
  // const appStore = useAppStore()
  // const historyStore = useHistoryStore()
  // },
}

export const plugin: PluginMetadata = {
  name: 'vqq',
  displayName: '腾讯视频',
  urlInclude: ['v.qq.com', 'm.v.qq.com'],
  setup: ({ addHook }) => {
    addHook('updateUrl', updateUrl)
  },
}
