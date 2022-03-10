<script setup lang="ts">
  import { useAppStore, useTabsStore } from '@/store'
  import { saveWindowSize, initMouseStateDirtyCheck, watchAlwaysOnTop } from '@/utils'
  import { START, userAgent } from '~/common/constant'
  import { callViewMethod } from '@/utils/view'
  import overlayScrollbars from 'overlayscrollbars'
  import { ipcRendererOn } from '@/utils/ipc'

  const appStore = useAppStore()
  const tabsStore = useTabsStore()
  const route = useRoute()
  const router = useRouter()
  const showTopBar = computed(() => appStore.showTopBar)
  const autoHideBar = computed(() => appStore.autoHideBar)
  const scrollContainer = ref()

  ipcRendererOn()
  // tabsStore.init()

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
          const tab = tabsStore.selectedTab()
          if (tab) {
            appStore.title = tab.title
          }
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

  const startupTab = async () => {
    await tabsStore.addTabs([
      {
        url: START,
        active: true,
        options: {
          userAgent: userAgent.mobile,
        },
      },
    ])
  }
  startupTab()
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
    transform: translate3d(20%, 0, 0);
    opacity: 0;
  }
  .slide-left-enter-active {
    transition: all 0.15s ease-out;
  }
  .slide-left-leave-to {
    position: absolute;
    transform: translate3d(-10%, 0, 0);
    opacity: 0;
  }
  .slide-left-leave-active {
    transition: all 0.15s ease-in;
  }

  .slide-right-enter-from {
    transform: translate3d(-10%, 0, 0);
    opacity: 0;
  }
  .slide-right-enter-active {
    transition: all 0.15s ease-out;
  }
  .slide-right-leave-to {
    position: absolute;
    transform: translate3d(20%, 0, 0);
    opacity: 0;
  }
  .slide-right-leave-active {
    transition: all 0.15s ease-in;
  }

  #main {
    display: flex;
    flex-direction: column;
    height: 100%;
    margin-top: -2rem;
    transition: all 0.2s ease;
    // background: var(--theme-color-bg);

    &.autoHideBar {
      display: block;
    }

    &.showTopBar {
      margin-top: 0;
    }
  }
</style>
