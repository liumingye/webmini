<script setup lang="ts">
  import WebView from '@/views/pages/WebView.vue'

  import { WatchStopHandle } from 'vue'
  import { useAppStore, usePluginStore } from '@/store'
  import { currentWindowType, replaceTitle } from '@/utils'
  import { debounce } from 'lodash-es'
  import OverlayScrollbars from 'overlayscrollbars'

  const appStore = useAppStore()
  const route = useRoute()
  const router = useRouter()
  const showTopBar = ref(true)
  const autoHideBar = computed(() => appStore.autoHideBar)
  const scrollContainer = ref()

  // 加载内置插件
  const pluginStore = usePluginStore()
  pluginStore.getBuiltInPlugins()

  const app = window.app

  // windows下frameless window没法正确检测到mouseout事件，只能根据光标位置做个dirtyCheck了
  const initMouseStateDirtyCheck = () => {
    const lastStatus = ref<'OUT' | 'IN'>()
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
    const timeout = ref()
    watchEffect(() => {
      app.logger.debug(`watchEffect - autoHideBar - ${autoHideBar.value}`, { label: 'Main.vue' })
      clearInterval(timeout.value)
      if (autoHideBar.value) {
        timeout.value = setInterval(Fn, 200)
        return
      }
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
    saveWindowSize()
    initMouseStateDirtyCheck()
    watchAlwaysOnTop()

    OverlayScrollbars(scrollContainer.value, {
      scrollbars: {
        autoHide: 'leave',
        clickScrolling: true,
      },
      overflowBehavior: {
        x: 'hidden',
        y: 'scroll',
      },
    })

    watch(
      () => route.name,
      (value) => {
        if (value === 'Home') {
          appStore.webview.setAudioMuted(false)
          appStore.title = replaceTitle(appStore.webview.getTitle()) || 'bilimini'
          return
        }
        appStore.webview.setAudioMuted(true)
        if (route.meta.title) {
          appStore.title = route.meta.title
        }
      },
    )
  })

  router.afterEach((to, from) => {
    const toDepth = to.path.split('/').length
    const fromDepth = from.path.split('/').length
    to.meta.transition = toDepth < fromDepth ? 'slide-right' : 'slide-left'
  })
</script>

<template>
  <main id="main" :class="['select-none', { showTopBar, autoHideBar }]">
    <TopBar />
    <div ref="scrollContainer" class="relative h-full w-full bg-$color-bg-2 text-$color-text-1">
      <WebView v-show="route.name === 'Home'" />
      <router-view v-slot="{ Component }">
        <transition :name="route.meta.transition">
          <!-- <keep-alive :include="[]"> -->
          <component :is="Component" class="min-h-full min-w-full" />
          <!-- </keep-alive> -->
        </transition>
      </router-view>
    </div>
  </main>
</template>

<style lang="less" scoped>
  .slide-left-enter-from {
    opacity: 0;
    transform: translate3d(20%, 0, 0);
  }
  .slide-left-enter-active {
    transition: all 0.15s ease-out;
  }
  .slide-left-leave-to {
    opacity: 0;
    transform: translate3d(-10%, 0, 0);
    position: absolute;
  }
  .slide-left-leave-active {
    transition: all 0.15s ease-in;
  }

  .slide-right-enter-from {
    opacity: 0;
    transform: translate3d(-10%, 0, 0);
  }
  .slide-right-enter-active {
    transition: all 0.15s ease-out;
  }
  .slide-right-leave-to {
    opacity: 0;
    transform: translate3d(20%, 0, 0);
    position: absolute;
  }
  .slide-right-leave-active {
    transition: all 0.15s ease-in;
  }

  #main {
    display: flex;
    flex-direction: column;
    transition: all 0.2s ease;
    height: 100%;
    margin-top: -2rem;

    &.autoHideBar {
      display: block;
    }

    &.showTopBar {
      margin-top: 0;
    }
  }
</style>
