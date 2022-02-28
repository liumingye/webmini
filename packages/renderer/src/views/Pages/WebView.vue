<script setup lang="ts">
  import { useAppStore, useHistoryStore } from '@/store'
  import { resizeMainWindow, getVid, getPartOfBangumi, getPartOfVideo } from '@/utils'
  import { userAgent, START } from '@/utils/constant'
  import NProgress from 'nprogress' // progress bar

  const ipc = window.ipcRenderer
  const appStore = useAppStore()
  const historyStore = useHistoryStore()
  const _webview = ref()
  const preload = window.app.preload
  const webview = computed(() => appStore.webview)

  // NProgress Configuration
  NProgress.configure({ easing: 'ease', speed: 200, trickleSpeed: 50, showSpinner: false })

  const setListeners = () => {
    let lastVid: string
    let lastLoadedUrl: string

    const updateURL = () => {
      const url = webview.value.getURL()
      if (lastLoadedUrl === url) return
      lastLoadedUrl = url
      appStore.updateURL(url)
      // 改变窗口尺寸
      resizeMainWindow()
      const vid = getVid(url)
      if (vid) {
        // 现在存在同一个视频自动跳下一p的可能，这时也会触发路由重新加载页面，但是这时不应该重新获取分p数据
        if (vid !== lastVid) {
          getPartOfVideo(vid)
          lastVid = vid
        }
      } else if (url.indexOf('www.bilibili.com/bangumi/play/') >= 0) {
        getPartOfBangumi(url)
      }
    }

    webview.value.addEventListener('load-commit', () => {
      updateURL()
    })

    webview.value.addEventListener('did-start-loading', () => {
      NProgress.start().inc()
    })

    webview.value.addEventListener('did-stop-loading', () => {
      NProgress.done()
    })

    webview.value.addEventListener('new-window', ({ url }) => {
      appStore.go(url)
    })
  }

  onMounted(() => {
    appStore.webview = _webview.value

    setListeners()

    // 收到选p消息时跳p
    ipc.on('select-part', (ev, pid) => {
      appStore.goPart(pid)
    })
    ipc.on('select-bangumi-part', (ev, ep) => {
      console.log(ep)
      appStore.goBangumiPart(ep)
    })
    ipc.on('openWebviewDevTools', () => {
      webview.value.openDevTools()
    })
    // 用户按↑、↓键时，把事件传递到webview里去实现修改音量功能
    ipc.on('change-volume', (ev, arg) => {
      webview.value.send('change-volume', arg)
    })
    // 按下ESC键
    ipc.on('press-esc', () => {
      historyStore.goBack()
    })
  })
</script>

<template>
  <component
    :is="'webview'"
    ref="_webview"
    :src="START"
    :useragent="userAgent.mobile"
    :preload="preload"
    webpreferences="nativeWindowOpen=no"
    class="w-full h-full"
  />
</template>
