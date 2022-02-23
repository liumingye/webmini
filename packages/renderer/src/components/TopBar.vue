<script setup lang="ts">
  import { computed, watch } from 'vue'
  import { useAppStore, useHistoryStore } from '@/store'
  import { resizeMainWindow } from '@/utils'
  import { START } from '@/utils/constant'
  import { Home, Left, Right, Windmill, CloseSmall, Help } from '@/components/Icon'
  import { useRoute, useRouter } from 'vue-router'

  const ipc = window.ipcRenderer
  const appStore = useAppStore()
  const route = useRoute()
  const router = useRouter()
  const historyStore = useHistoryStore()
  const webview = computed(() => appStore.webview)
  const disableDanmakuButton = computed(() => appStore.disableDanmakuButton)
  const disablePartButton = computed(() => appStore.disablePartButton)
  const title = computed(() => appStore.title.replace('_哔哩哔哩_bilibili', ''))

  webview.value.addEventListener('page-title-updated', (event) => {
    appStore.title = event.title
  })

  webview.value.addEventListener('dom-ready', () => {
    appStore.title = webview.value.getTitle()
  })

  historyStore.listen((to) => {
    appStore.go(to)
  })

  const tempStore: Record<string, any> = {}

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
    // 恢复状态
    appStore.autoHideBar = tempStore['autoHideBar']
    router.back()
    resizeMainWindow()
  }

  const goForward = () => {
    const is = isHome()
    if (is) {
      historyStore.goForward()
      return
    }
    // 恢复状态
    appStore.autoHideBar = tempStore['autoHideBar']
    router.forward()
    resizeMainWindow()
  }

  const toggleDanmaku = () => {
    webview.value.executeJavaScript(
      "document.querySelector('.bilibili-player-video-danmaku-switch .bui-switch-input').click()",
    )
  }

  const toggleSelectPartWindow = () => {
    console.log('主窗口：点击P')
    ipc.send('toggle-select-part-window')
  }

  const showNav = () => {
    const is = isHome()
    if (is) {
      // 临时保存一下状态
      tempStore['autoHideBar'] = appStore.autoHideBar
    }
    router.push({
      name: 'WebNav',
    })
    resizeMainWindow('mobile')
    appStore.autoHideBar = false
  }

  const showAbout = () => {
    appStore.showAbout = !appStore.showAbout
  }

  const turnOff = () => {
    ipc.send('close-main-window')
  }
</script>

<template>
  <div id="topbar">
    <div class="button-group">
      <button id="navi-back" title="后退" :disabled="disableBack" @click="goBack">
        <Left />
      </button>
      <button id="navi-forward" title="前进" :disabled="disableForward" @click="goForward">
        <Right />
      </button>
      <button id="navi-home" title="返回首页" @click="naviGoHome">
        <Home />
      </button>
    </div>
    <div class="title">
      {{ title }}
    </div>
    <div class="button-group">
      <button
        id="app-danmaku"
        title="开/关弹幕"
        :disabled="disableDanmakuButton || route.name !== 'Home'"
        @click="toggleDanmaku"
      >
        弹
      </button>
      <button
        id="app-part"
        title="分P列表"
        :disabled="disablePartButton || route.name !== 'Home'"
        @click="toggleSelectPartWindow"
      >
        P
      </button>
      <button title="导航" :disabled="route.name === 'WebNav'" @click="showNav">
        <Windmill />
      </button>
      <!-- <span
        id="app-config"
        title="设置"

        alt="toggleConfig"
      ></span> -->
      <button title="关于" @click="showAbout">
        <Help />
      </button>
      <button title="退出" @click="turnOff">
        <CloseSmall />
      </button>
    </div>
  </div>
</template>

<style lang="less" scoped>
  #topbar {
    user-select: none;
    display: flex;
    justify-content: space-between;
    background: @color-bg-pink;
    line-height: 36px;
    height: 36px;
    padding: 0 1em;
    left: 0;
    width: 100%;
    z-index: 9;
    -webkit-app-region: drag;

    .title {
      flex: 1;
      padding: 0 10px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      color: @color-bg-white;
      text-align: center;
    }

    .button-group {
      grid-gap: 6px;
      gap: 6px;
      display: flex;
      align-items: center;

      button {
        display: flex;
        justify-content: center;
        align-items: center;
        -webkit-app-region: no-drag;
        border-radius: 100%;
        width: 15px;
        height: 15px;
        background: @color-bg-white;
        opacity: 0.5;
        color: @color-bg-pink;
        cursor: pointer;
        transition: opacity 0.2s ease;

        &[disabled] {
          opacity: 0.2;
        }

        &:not([disabled]):hover {
          opacity: 1;
        }

        span {
          display: flex;
          justify-content: center;
          align-items: center;
          :deep(svg) {
            width: 0.95em;
            height: 0.95em;
          }
        }

        &#navi-back {
          span {
            :deep(svg) {
              margin-left: -2px;
            }
          }
        }
        &#navi-forward {
          span {
            :deep(svg) {
              margin-left: 1px;
            }
          }
        }
        &#app-danmaku,
        &#app-part {
          font-size: 10px;
        }
      }
    }
  }
</style>
