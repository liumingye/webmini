<script setup lang="ts">
  import { useAppStore, useHistoryStore } from '@/store'
  import { resizeMainWindow, replaceTitle } from '@/utils'
  import { userAgent, START } from '@/utils/constant'
  import NProgress from 'nprogress' // progress bar

  const ipc = window.ipcRenderer
  const appStore = useAppStore()
  const historyStore = useHistoryStore()
  const preload = window.app.preload
  const webviewRef = ref()
  const webview = computed(() => appStore.webview)

  // NProgress Configuration
  NProgress.configure({ easing: 'ease', speed: 200, trickleSpeed: 50, showSpinner: false })

  const setListeners = () => {
    let lastLoadedUrl: string

    const updateURL = () => {
      const url = webview.value.getURL()
      if (lastLoadedUrl === url) return
      lastLoadedUrl = url
      appStore.updateURL(url)
      // 改变窗口尺寸
      resizeMainWindow()
    }

    webview.value.addEventListener('load-commit', () => {
      updateURL()
    })

    const didStopLoading = () => {
      webview.value.removeEventListener('did-stop-loading', didStopLoading)
      NProgress.done()
    }

    webview.value.addEventListener('did-start-loading', () => {
      NProgress.start().inc()
      // fix: GUEST_VIEW_MANAGER_CALL
      // https://github.com/electron/electron/issues/28208#issuecomment-870989112
      webview.value.addEventListener('did-stop-loading', didStopLoading)
    })

    webview.value.addEventListener('new-window', ({ url }) => {
      appStore.go(url)
    })

    // update title
    webview.value.addEventListener('page-title-updated', (event) => {
      // window.app.logger.debug(`page-title-updated - ${event.title}`)
      appStore.title = replaceTitle(event.title) || 'bilimini'
      document.title = appStore.title
    })
  }

  onMounted(() => {
    appStore.webview = webviewRef.value

    setListeners()

    // 收到选p消息时跳p
    ipc.on('go', (ev, url) => {
      appStore.go(url)
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
    ref="webviewRef"
    :src="START"
    :useragent="userAgent.mobile"
    :preload="preload"
    webpreferences="nativeWindowOpen=no"
    class="w-full h-full"
  />
</template>
