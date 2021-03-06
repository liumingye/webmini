<script setup lang="ts">
  import { useAppStore, useTabsStore } from '@/store'
  import type { AppStateTypes } from '@/store/modules/app/types'
  import { resizeMainWindow } from '@/utils'
  import { callViewMethod } from '@/utils/view'
  import {
    IconCompass,
    IconLeft,
    IconRight,
    IconClose,
    IconMinus,
    IconBookmark,
    IconHome,
  } from '@arco-design/web-vue/es/icon'
  import { WindowTypeEnum } from '~/interfaces/view'

  const ipc = window.ipcRenderer
  const appStore = useAppStore()
  const tabsStore = useTabsStore()
  const route = useRoute()
  const router = useRouter()
  const disableDanmakuButton = computed(() => appStore.disableDanmakuButton)
  const disablePartButton = computed(() => appStore.disablePartButton)
  const title = computed(() => appStore.title)

  const tempStore: Partial<AppStateTypes> = {}

  router.beforeEach((to, from) => {
    // 恢复状态
    if (to.name === 'Browser') {
      window.ipcRenderer.invoke(`browserview-show-${appStore.currentWindowID}`)
      if (tempStore.autoHideBar) {
        appStore.autoHideBar = tempStore.autoHideBar
      }
    }
    // 保存状态
    else if (from.name === 'Browser') {
      window.ipcRenderer.invoke(`browserview-hide-${appStore.currentWindowID}`)
      tempStore.autoHideBar = appStore.autoHideBar
      resizeMainWindow(WindowTypeEnum.MOBILE)
      appStore.autoHideBar = false
    }
  })

  router.afterEach((to) => {
    if (to.name === 'Browser') {
      resizeMainWindow()
    }
  })

  const minimize = () => {
    window.app.currentWindow.minimize()
  }

  const isBrowser = () => {
    return route.name === 'Browser'
  }

  const go = (name: string | symbol, params = {}) => {
    router.push({
      name: name,
      params,
    })
  }

  const isShowStartPage = () => {
    const focusedTab = tabsStore.getFocusedTab()
    return focusedTab?.plugin?.start
  }

  const isShowWebNav = () => {
    const is = isBrowser()
    if (!is) return false
    const focusedTab = tabsStore.getFocusedTab()
    return focusedTab && focusedTab.plugin
  }

  const goWebNav = () => {
    const focusedTab = tabsStore.getFocusedTab()
    if (focusedTab && focusedTab.plugin) {
      go('WebNav', { pluginName: focusedTab.plugin.name })
    }
  }

  const goStartPage = () => {
    const focusedTab = tabsStore.getFocusedTab()
    if (focusedTab && focusedTab.plugin) {
      go('Browser')
      appStore.go(focusedTab.plugin.start, focusedTab.plugin)
    }
  }

  const isShowBrowser = () => {
    return tabsStore.list.length && !isBrowser()
  }

  const isShowBack = () => {
    const is = isBrowser()
    if (is) {
      return appStore.navigationState.canGoBack
    }
    // use _path as dependency to force computed update
    // eslint-disable-next-line
    const _path = route.path
    return !!window.history.state.back
  }

  const isShowForward = () => {
    const is = isBrowser()
    if (is) {
      return appStore.navigationState.canGoForward
    }
    // use _path as dependency to force computed update
    // eslint-disable-next-line
    const _path = route.path
    return !!window.history.state.forward
  }

  const goBack = () => {
    const is = isBrowser()
    if (is) {
      return tabsStore.getFocusedTab()?.callViewMethod('goBack')
    }
    router.back()
  }

  const goForward = () => {
    const is = isBrowser()
    if (is) {
      return tabsStore.getFocusedTab()?.callViewMethod('goForward')
    }
    router.forward()
  }

  const toggleDanmaku = () => {
    callViewMethod(
      tabsStore.tabId,
      'executeJavaScript',
      "document.querySelector('.bilibili-player-video-danmaku-switch .bui-switch-input,.bpx-player-dm-switch .bui-switch-input').click()",
    )
  }

  const toggleSelectPartWindow = () => {
    ipc.send('toggle-select-part-window')
  }

  const turnOff = () => {
    ipc.send('close-main-window')
  }
</script>

<template>
  <header class="drag flex flex-shrink-0 px-2 h-8 gap-1.5 items-center" :class="route.name">
    <div class="flex-1 flex gap-1.5">
      <b-button id="navi-back" title="后退" :disabled="!isShowBack()" @click="goBack">
        <IconLeft size=".8em" />
      </b-button>
      <b-button v-if="isShowForward()" title="前进" @click="goForward">
        <IconRight size=".8em" />
      </b-button>
      <b-button v-if="isShowStartPage()" title="开始页" @click="goStartPage">
        <IconHome size=".7em" />
      </b-button>
      <b-button v-if="isShowWebNav()" title="导航" @click="goWebNav">
        <IconBookmark size=".7em" />
      </b-button>
      <b-button
        v-if="!disableDanmakuButton && route.name === 'Browser'"
        id="app-danmaku"
        title="开/关弹幕"
        @click="toggleDanmaku"
      >
        <span>弹</span>
      </b-button>
      <b-button
        v-if="!disablePartButton && route.name === 'Browser'"
        id="app-part"
        title="分P列表"
        @click="toggleSelectPartWindow"
      >
        <span>P</span>
      </b-button>
    </div>
    <div class="truncate text-0.9em" :title="title">
      {{ title }}
    </div>
    <div class="flex-1 flex gap-1.5 justify-end">
      <b-button v-if="isShowBrowser()" title="浏览器" @click="go('Browser')">
        <IconCompass size=".8em" />
      </b-button>
      <b-button v-if="route.name !== 'Home'" title="主页" @click="go('Home')">
        <icon-windmill size=".8em" />
      </b-button>
      <b-button title="最小化" @click="minimize">
        <IconMinus size=".7em" />
      </b-button>
      <b-button title="退出" @click="turnOff">
        <IconClose size=".7em" />
      </b-button>
    </div>
  </header>
</template>

<style lang="less" scoped>
  header {
    color: var(--color-text-1);
    background: var(--color-bg-1);

    &.Browser,
    &.About {
      color: var(--theme-color-text) !important;
      background: var(--theme-color-bg) !important;
      button {
        color: var(--theme-color-text);
        background: rgba(70, 70, 70, 0.2);

        &:not([disabled]):hover {
          background: rgba(70, 70, 70, 0.4);
        }

        &:not([disabled]):active {
          background: rgba(70, 70, 70, 0.6);
        }
      }
    }
  }

  #navi-back {
    :deep(svg) {
      margin-left: -1px;
    }
  }
  #app-danmaku,
  #app-part {
    font-size: 0.7em;
  }
</style>
