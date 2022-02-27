<script setup lang="ts">
  import TopBar from '@/components/TopBar.vue'
  import About from '@/components/About.vue'
  import WebView from '@/views/pages/WebView.vue'

  import { useAppStore } from '@/store'
  import { ref, onMounted, computed, watch } from 'vue'
  import { currentWindowType } from '@/utils'
  import debounce from '@/utils/debounce'
  import { useRoute } from 'vue-router'

  const appStore = useAppStore()
  const route = useRoute()
  const showTopBar = ref(true)
  const mounted = ref(false)
  const showAbout = computed(() => appStore.showAbout)
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
    watch(
      () => autoHideBar.value,
      (value) => {
        if (value) {
          timeout.value = setInterval(Fn, 200)
          return
        }
        clearInterval(timeout.value)
        showTopBar.value = true
      },
    )
  }

  const loadWindowSize = () => {
    // 恢复窗口尺寸和位置
    const position: Record<string, number> = {}
    if (appStore.windowPosition !== null) {
      position.x = appStore.windowPosition[0]
      position.y = appStore.windowPosition[1]
    }
    app.currentWindow.setBounds(
      {
        width: appStore.windowSize.mobile[0],
        height: appStore.windowSize.mobile[1],
        ...position,
      },
      false,
    )
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
        appStore.saveSelfToLocalStorage()
      }
      app.currentWindow.once('resized', resized)
    }, 500)
    const moved = debounce(() => {
      // 解决full-reload后会重复绑定事件
      if (app.currentWindow.isDestroyed()) return
      app.logger.info('moved')
      appStore.windowPosition = app.currentWindow.getPosition()
      appStore.saveSelfToLocalStorage()
      app.currentWindow.once('moved', moved)
    }, 500)
    app.currentWindow.once('resized', resized)
    app.currentWindow.once('moved', moved)
  }

  onMounted(() => {
    mounted.value = true

    loadWindowSize()
    saveWindowSize()
    initMouseStateDirtyCheck()

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
  <div id="main" :class="['select-none', { showTopBar, showAbout, autoHideBar }]">
    <keep-alive>
      <About v-if="showAbout" />
    </keep-alive>
    <TopBar v-if="mounted" />
    <router-view v-slot="{ Component }">
      <keep-alive :include="[]">
        <component :is="Component" class="overflow-x-none overflow-y-auto" />
      </keep-alive>
    </router-view>
    <WebView v-show="route.name === 'Home'" />
  </div>
</template>

<style lang="less" scoped>
  #main {
    display: flex;
    flex-direction: column;
    transition: all 0.2s ease;
    height: 100%;
    margin-top: -36px;

    &.autoHideBar {
      display: block;
    }

    &.showTopBar {
      margin-top: 0;
    }

    &.showAbout {
      margin-top: 150px;
    }
  }
</style>
