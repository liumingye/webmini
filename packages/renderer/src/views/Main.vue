<script setup lang="ts">
  import TopBar from '@/components/TopBar.vue'
  import BiliWeb from '@/components/BiliWeb.vue'
  import GotoTarget from '@/components/GoTarget.vue'
  import About from '@/components/About.vue'

  import { useAppStore } from '@/store'
  import { ref, onMounted, computed, watch } from 'vue'
  import { currentWindowType } from '@/utils'
  import debounce from '@/utils/debounce'

  const appStore = useAppStore()

  const showTopBar = ref(true)
  const mounted = ref(false)
  const showGotoTarget = computed(() => appStore.showGotoTarget)
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
      lastStatus.value = 'OUT'
      showTopBar.value = false
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
        width: appStore.windowSize.default[0],
        height: appStore.windowSize.default[1],
        ...position,
      },
      true,
    )
  }
  const saveWindowSize = () => {
    app.currentWindow.on('resized', () => {
      console.log('resized')
      const currentSize = appStore.windowSize[currentWindowType.value]
      const newSize: number[] = [window.innerWidth, window.innerHeight]
      if (currentSize !== newSize) {
        appStore.windowSize[currentWindowType.value] = newSize
        appStore.saveSelfToLocalStorage()
      }
    })
    const moved = debounce(() => {
      console.log('moved')
      appStore.windowPosition = app.currentWindow.getPosition()
      appStore.saveSelfToLocalStorage()
    }, 500)
    app.currentWindow.on('moved', () => {
      moved()
    })
  }

  onMounted(() => {
    loadWindowSize()
    saveWindowSize()
    initMouseStateDirtyCheck()
    mounted.value = true
  })
</script>

<template>
  <div id="main" :class="{ showTopBar, showAbout, autoHideBar }">
    <keep-alive>
      <About v-if="showAbout" />
    </keep-alive>
    <TopBar v-if="mounted" />
    <BiliWeb />
    <GotoTarget v-if="showGotoTarget" />
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
