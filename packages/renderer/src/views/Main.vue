<script setup lang="ts">
  import { useAppStore, useTabsStore } from '@/store'
  import { initMouseStateDirtyCheck, watchAlwaysOnTop } from '@/utils'
  import { ipcRendererOn } from '@/utils/ipc'
  import { callViewMethod } from '@/utils/view'
  import overlayScrollbars from 'overlayscrollbars'
  // import NProgress from 'nprogress'

  const appStore = useAppStore()
  const tabsStore = useTabsStore()
  const route = useRoute()
  const router = useRouter()
  const showTopBar = computed(() => appStore.showTopBar)
  const scrollContainer = ref()
  const scrollbars = ref<overlayScrollbars>()

  ipcRendererOn()

  onMounted(() => {
    // windows下frameless window没法正确检测到mouseout事件，只能根据光标位置做个dirtyCheck了
    initMouseStateDirtyCheck()
    watchAlwaysOnTop()

    scrollbars.value = overlayScrollbars(scrollContainer.value, {
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
        if (value === 'Browser') {
          callViewMethod(tabsStore.tabId, 'setAudioMuted', false)
          const tab = tabsStore.getFocusedTab()
          if (tab) {
            appStore.title = tab.title
          }
          return
        }
        callViewMethod(tabsStore.tabId, 'setAudioMuted', true)
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

  // router.beforeEach(() => {
  //   NProgress.start().inc()
  //   if (from.name) {
  //     from.matched[0].meta.scrollTop = scrollbars.value?.scroll().position.y
  //   }
  // })

  // router.afterEach(() => {
  //   NProgress.done()
  // })

  // router.options.scrollBehavior = (to, from) => {
  //   if (to.name === from.name) return
  //   setTimeout(() => {
  //     scrollbars.value?.scroll({ y: to.meta.scrollTop || 0 })
  //   }, 0)
  // }
</script>

<template>
  <main
    id="main"
    class="transition-transform h-full select-none"
    :class="[{ showTopBar }, route.name === 'Browser' ? 'bg-$theme-color-bg' : 'bg-$color-bg-2']"
  >
    <TopBar />
    <div ref="scrollContainer" class="text-$color-text-1 h-[calc(100%-2rem)] w-full">
      <router-view v-slot="{ Component }">
        <transition :name="route.meta.transition">
          <keep-alive>
            <component :is="Component" class="min-h-full bg-$color-bg-1" />
          </keep-alive>
        </transition>
      </router-view>
    </div>
  </main>
</template>

<style lang="less" scoped>
  #main {
    transform: translate3d(0, -2rem, 0);
    will-change: transform;

    &.showTopBar {
      transform: translate3d(0, 0, 0);
    }
  }
</style>
