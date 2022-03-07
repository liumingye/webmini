<script setup lang="ts">
  import { useAppStore, usePluginStore, useHistoryStore, useTabsStore } from '@/store'
  import { saveWindowSize, initMouseStateDirtyCheck, watchAlwaysOnTop } from '@/utils'
  import { START, userAgent } from '@/utils/constant'
  import { callViewMethod } from '@/utils/view'
  import overlayScrollbars from 'overlayscrollbars'

  const appStore = useAppStore()
  const historyStore = useHistoryStore()
  const pluginStore = usePluginStore()
  const tabsStore = useTabsStore()
  const route = useRoute()
  const router = useRouter()
  const showTopBar = computed(() => appStore.showTopBar)
  const autoHideBar = computed(() => appStore.autoHideBar)
  const scrollContainer = ref()

  tabsStore.init()

  onMounted(() => {
    saveWindowSize()
    // windows下frameless window没法正确检测到mouseout事件，只能根据光标位置做个dirtyCheck了
    initMouseStateDirtyCheck()
    watchAlwaysOnTop()

    overlayScrollbars(scrollContainer.value, {
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
          callViewMethod(tabsStore.selectedTabId, 'setAudioMuted', false)
          appStore.title = tabsStore.selectedTab().title
          return
        }
        callViewMethod(tabsStore.selectedTabId, 'setAudioMuted', true)
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

  // 加载内置插件
  pluginStore.getBuiltInPlugins().then(() => {
    startupTab()
  })

  const startupTab = async () => {
    await tabsStore.addTabs([
      {
        url: START,
        active: true,
        userAgent: userAgent.mobile,
      },
    ])
  }

  // 收到选p消息时跳p
  window.ipcRenderer.on('go', (ev, url) => {
    console.log(url)
    appStore.go(url)
  })
  // 用户按↑、↓键时，把事件传递到webview里去实现修改音量功能
  window.ipcRenderer.on('change-volume', (ev, arg) => {
    callViewMethod(tabsStore.selectedTabId, 'send', 'change-volume', arg)
    // webview.value.send('change-volume', arg)
  })
  // 按下ESC键
  window.ipcRenderer.on('press-esc', () => {
    historyStore.goBack()
  })
</script>

<template>
  <main id="main" :class="['select-none', { showTopBar, autoHideBar }]">
    <TopBar />
    <div ref="scrollContainer" class="relative h-full w-full bg-$color-bg-2 text-$color-text-1">
      <!-- <WebView v-show="route.name === 'Home'" /> -->
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
