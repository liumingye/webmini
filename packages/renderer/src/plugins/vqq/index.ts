import { PluginMetadata } from '@/store/modules/plugin/types'
import { useAppStore, useHistoryStore } from '@/store'
import { userAgent } from '@/utils/constant'
import { loadURL } from '@/utils/view'

// const last = reactive({
//   vid: '',
// })

export const plugin: PluginMetadata = {
  name: 'vqq',
  displayName: '腾讯视频',
  urlInclude: ['v.qq.com', 'm.v.qq.com', 'm.film.qq.com'],
  setup: ({ addHook, addData }) => {
    addData('themeColor', (presetBase: Record<string, Record<string, string>>) => {
      presetBase.light = {
        bg: '#fff',
        text: '#111c2e',
      }
      presetBase.dark = {
        bg: '#111c2e',
        text: '#fff',
      }
    })
    addData('userAgent', (presetBase: Record<string, string[]>) => {
      presetBase.mobile = ['m.v.qq.com', 'm.film.qq.com', 'm.film.qq.com']
    })
    addData('windowType', (presetBase: Record<string, (string | RegExp)[]>) => {
      presetBase.mini = [/(m\.|)v\.qq\.com(.*?)(\/cover|\/play)/]
    })
    addHook('updateUrl', {
      after: ({ url }: { url: URL }) => {
        const appStore = useAppStore()
        const historyStore = useHistoryStore()

        // test
        // https://v.qq.com/x/cover/pld2wqk8kq044nv/r0035yfoa2m.html
        // https://m.v.qq.com/x/m/play?cid=u496ep9wpw4rkno&vid=
        // https://m.v.qq.com/cover/m/mzc00200jtxd9ap.html?vid=d0042iplesm
        // https://m.v.qq.com/x/play.html?cid=od1kjfd56e3s7n7
        const cidArr = /(cid=|\/)([A-Za-z0-9]{15})/.exec(url.pathname + url.search)
        // window.app.logger.debug(cidArr)
        if (cidArr) {
          const vidArr = /(vid=|\/)([A-Za-z0-9]{11})(\.|$|&)/.exec(url.pathname + url.search)
          const cid = cidArr[2]
          const vid = vidArr ? vidArr[2] : ''
          if (url.hostname === 'm.v.qq.com') {
            historyStore.pop()
            const url = ref(`https://v.qq.com/x/cover/${cid}`)
            if (vid !== '') {
              url.value += `/${vid}`
            }
            url.value += `.html`
            loadURL(url.value, {
              userAgent: userAgent.desktop,
            })
          }
          // if (cid + vid !== lastId) {
          // getPartOfQQ(cid, vid)
          // lastId = cid + vid
          // console.log(lastId)
          // }
          appStore.disableDanmakuButton = true
          appStore.disablePartButton = true
          appStore.autoHideBar = true
          return
        }
      },
    })
  },
}
