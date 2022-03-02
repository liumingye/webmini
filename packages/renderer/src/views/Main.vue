<script setup lang="ts">
  import TopBar from '@/components/TopBar.vue'
  // import About from '@/views/pages/About.vue'
  import WebView from '@/views/pages/WebView.vue'

  import { WatchStopHandle } from 'vue'
  import { useAppStore } from '@/store'
  import { currentWindowType } from '@/utils'
  import debounce from '@/utils/debounce'

  const appStore = useAppStore()
  const route = useRoute()
  const showTopBar = ref(true)
  const mounted = ref(false)
  const autoHideBar = computed(() => appStore.autoHideBar)

  const app = window.app

  // windows下frameless window没法正确检测到mouseout事件，只能根据光标位置做个dirtyCheck了
  const initMouseStateDirtyCheck = () => {
    const lastStatus = ref<'OUT' | 'IN'>()
    const timeout = ref()
    const Fn = () => {
      const mousePos = app.screen.getCursorScreenPoint(),
        windowPos = app.currentWindow.getPosition(),
        windowSize = app.currentWindow.getSize()
      const getTriggerAreaWidth = () => {
        return lastStatus.value == 'IN' ? 0 : 16
      }
      const getTriggerAreaHeight = () => {
        let h = 0.1 * windowSize[1],
          minHeight = lastStatus.value == 'IN' ? 120 : 36
        return h > minHeight ? h : minHeight
      }
      if (
        mousePos.x > windowPos[0] &&
        mousePos.x < windowPos[0] + windowSize[0] - getTriggerAreaWidth() &&
        mousePos.y > windowPos[1] - 10 &&
        mousePos.y < windowPos[1] + getTriggerAreaHeight()
      ) {
        if (lastStatus.value == 'OUT') {
          showTopBar.value = true
          lastStatus.value = 'IN'
        }
        return
      }
      showTopBar.value = false
      lastStatus.value = 'OUT'
    }
    watchEffect(() => {
      app.logger.debug('watchEffect - autoHideBar', { label: 'Main.vue' })
      if (autoHideBar.value) {
        timeout.value = setInterval(Fn, 200)
        return
      }
      clearInterval(timeout.value)
      showTopBar.value = true
    })
  }

  const saveWindowSize = () => {
    const resized = debounce(() => {
      // 解决full-reload后会重复绑定事件
      if (app.currentWindow.isDestroyed()) return
      app.logger.info('resized')
      const currentSize = appStore.windowSize[currentWindowType.value]
      const newSize: number[] = [window.innerWidth, window.innerHeight]
      if (currentSize !== newSize) {
        appStore.windowSize[currentWindowType.value] = newSize
        appStore.saveConfig('windowSize', toRaw(appStore.windowSize))
      }
      app.currentWindow.once('resized', resized)
    }, 500)
    const moved = debounce(() => {
      // 解决full-reload后会重复绑定事件
      if (app.currentWindow.isDestroyed()) return
      app.logger.info('moved')
      if (currentWindowType.value === 'mobile') {
        appStore.saveConfig('windowPosition', app.currentWindow.getPosition())
      }
      app.currentWindow.once('moved', moved)
    }, 500)
    app.currentWindow.once('resized', resized)
    app.currentWindow.once('moved', moved)
  }

  const watchAlwaysOnTop = () => {
    let stopWatchWindowType: WatchStopHandle | null
    watchEffect(() => {
      if (stopWatchWindowType) {
        stopWatchWindowType()
        stopWatchWindowType = null
      }
      switch (appStore.alwaysOnTop) {
        case 'on':
          app.currentWindow.setAlwaysOnTop(true)
          break
        case 'off':
          app.currentWindow.setAlwaysOnTop(false)
          break
        default:
          app.currentWindow.setAlwaysOnTop(false)
          stopWatchWindowType = watch(
            () => currentWindowType.value,
            (value) => {
              // app.logger.debug(`currentWindowType - ${value}`)
              if (value === 'mini') {
                app.currentWindow.setAlwaysOnTop(true)
                return
              }
              app.currentWindow.setAlwaysOnTop(false)
            },
          )
          break
      }
    })
  }

  onMounted(() => {
    mounted.value = true

    saveWindowSize()
    initMouseStateDirtyCheck()
    watchAlwaysOnTop()

    watch(
      () => route.name,
      (value) => {
        if (value === 'Home') {
          appStore.webview.setAudioMuted(false)
          appStore.title = appStore.webview.getTitle()
          return
        }
        appStore.webview.setAudioMuted(true)
        if (route.meta.title) {
          appStore.title = route.meta.title
        }
      },
    )
  })
</script>

<template>
  <div id="main" :class="['select-none', { showTopBar, autoHideBar }]">
    <TopBar v-if="mounted" />
    <div class="relative h-full">
      <router-view v-slot="{ Component }">
        <!-- <keep-alive :include="[]"> -->
        <component :is="Component" class="h-full overflow-x-none overflow-y-auto" />
        <!-- </keep-alive> -->
      </router-view>
      <WebView v-show="route.name === 'Home'" />
    </div>
  </div>
</template>

<style lang="less" scoped>
  #main {
    display: flex;
    flex-direction: column;
    transition: all 0.2s ease;
    height: 100%;
    margin-top: -32px;

    &.autoHideBar {
      display: block;
    }

    &.showTopBar {
      margin-top: 0;
    }
  }
</style>
