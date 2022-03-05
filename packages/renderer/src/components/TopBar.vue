<script setup lang="ts">
  import { useAppStore, useHistoryStore } from '@/store'
  import { resizeMainWindow, currentWindowType } from '@/utils'
  import { START } from '@/utils/constant'

  const ipc = window.ipcRenderer
  const appStore = useAppStore()
  const route = useRoute()
  const router = useRouter()
  const historyStore = useHistoryStore()
  const webview = computed(() => appStore.webview)
  const disableDanmakuButton = computed(() => appStore.disableDanmakuButton)
  const disablePartButton = computed(() => appStore.disablePartButton)
  const title = computed(() => appStore.title)

  historyStore.listen((to) => {
    appStore.go(to)
  })

  const tempStore: Record<string, any> = {}
  router.beforeEach((to, from) => {
    // 恢复状态
    if (to.name === 'Home') {
      appStore.autoHideBar = tempStore.autoHideBar
    }
    // 保存状态
    if (from.name === 'Home') {
      tempStore.autoHideBar = appStore.autoHideBar
      tempStore.windowType = currentWindowType.value
      resizeMainWindow({ windowType: 'mobile' })
      appStore.autoHideBar = false
    }
  })
  router.afterEach((to) => {
    if (to.name === 'Home') {
      resizeMainWindow({ windowType: tempStore.windowType })
    }
  })

  const minimize = () => {
    window.app.currentWindow.minimize()
  }

  const isHome = () => {
    if (router.currentRoute.value.name === 'Home') {
      return true
    }
    return false
  }

  const naviGoHome = () => {
    const is = isHome()
    if (!is) {
      router.push({
        name: 'Home',
      })
    }
    appStore.go(START)
  }

  const disableBack = computed(() => {
    const is = isHome()
    if (is) {
      return !historyStore.canGoBack
    }
    // use _path as dependency to force computed update
    // eslint-disable-next-line
    const _path = route.path
    return window.history.state.back === null
  })

  const disableForward = computed(() => {
    const is = isHome()
    if (is) {
      return !historyStore.canGoForward
    }
    // use _path as dependency to force computed update
    // eslint-disable-next-line
    const _path = route.path
    return window.history.state.forward === null
  })

  const goBack = () => {
    const is = isHome()
    if (is) {
      historyStore.goBack()
      return
    }
    router.back()
  }

  const goForward = () => {
    const is = isHome()
    if (is) {
      historyStore.goForward()
      return
    }
    router.forward()
  }

  const toggleDanmaku = () => {
    webview.value.executeJavaScript(
      "document.querySelector('.bilibili-player-video-danmaku-switch .bui-switch-input,.bpx-player-dm-switch .bui-switch-input').click()",
    )
  }

  const toggleSelectPartWindow = () => {
    ipc.send('toggle-select-part-window')
  }

  const showNav = () => {
    router.push({
      name: 'WebNav',
    })
  }

  const showSettings = () => {
    router.push({
      name: 'Settings',
    })
  }

  const turnOff = () => {
    ipc.send('close-main-window')
  }
</script>

<template>
  <header class="drag flex flex-shrink-0 px-2 h-8 bg-$theme-color-bg gap-1.5 items-center">
    <div class="flex-1 flex gap-1.5">
      <b-button id="navi-back" title="后退" :disabled="disableBack" @click="goBack">
        <icon-left size=".9em" />
      </b-button>
      <b-button v-if="!disableForward" title="前进" @click="goForward">
        <icon-right size=".9em" />
      </b-button>
      <b-button id="navi-home" title="返回首页" @click="naviGoHome">
        <icon-home size=".8em" />
      </b-button>
    </div>
    <div class="truncate text-$theme-color-text text-0.9em" :title="title">
      {{ title }}
    </div>
    <div class="flex-1 flex gap-1.5 justify-end">
      <b-button
        v-if="!disablePartButton && route.name === 'Home'"
        id="app-part"
        title="分P列表"
        @click="toggleSelectPartWindow"
      >
        <span>P</span>
      </b-button>
      <b-button
        v-if="!disableDanmakuButton && route.name === 'Home'"
        id="app-danmaku"
        title="开/关弹幕"
        @click="toggleDanmaku"
      >
        <span>弹</span>
      </b-button>
      <b-button title="导航" :disabled="route.name === 'WebNav'" @click="showNav">
        <icon-windmill size=".8em" />
      </b-button>
      <b-button title="设置" :disabled="route.name === 'Settings'" @click="showSettings">
        <icon-setting-two size=".8em" />
      </b-button>
      <b-button title="退出" @click="turnOff" @click.right="minimize">
        <icon-close-small size=".85em" />
      </b-button>
    </div>
  </header>
</template>

<style lang="less" scoped>
  button {
    background: var(--theme-color-text);
    color: var(--theme-color-bg);
  }

  #navi-back {
    span {
      :deep(svg) {
        margin-left: -1px;
      }
    }
  }
  #app-danmaku,
  #app-part {
    font-size: 0.7em;
  }
</style>
