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
    await tabsStore.addTab({
      url: START,
      options: {
        userAgent: userAgent.mobile,
      },
    })
  }
  startupTab()
</script>

<template>
  <main
    id="main"
    class="transition-all flex flex-col h-full"
    :class="['select-none', { showTopBar, autoHideBar }]"
  >
    <TopBar />
    <div
      ref="scrollContainer"
      class="relative h-full w-full text-$color-text-1"
      :class="route.name === 'Home' ? 'bg-$theme-color-bg' : 'bg-$color-bg-2'"
    >
      <router-view v-slot="{ Component }">
        <transition :name="route.meta.transition">
          <component :is="Component" class="min-h-full min-w-full" />
        </transition>
      </router-view>
    </div>
  </main>
</template>

<style lang="less" scoped>
  #main {
    margin-top: -2rem;

    &.autoHideBar {
      display: block;
    }

    &.showTopBar {
      margin-top: 0;
    }
  }
</style>
