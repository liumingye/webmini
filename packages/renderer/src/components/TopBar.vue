<script setup lang="ts">
  import { computed } from 'vue'
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
  const canGoBack = computed(() => historyStore.canGoBack)
  const canGoForward = computed(() => historyStore.canGoForward)
  const disableDanmakuButton = computed(() => appStore.disableDanmakuButton)
  const disablePartButton = computed(() => appStore.disablePartButton)
  const title = computed(() => appStore.title)

  webview.value.addEventListener('page-title-updated', (event) => {
    appStore.title = event.title
  })

  webview.value.addEventListener('dom-ready', () => {
    appStore.title = webview.value.getTitle()
  })

  historyStore.listen((to) => {
    appStore.go(to)
  })

  const isBiliWeb = () => {
    if (router.currentRoute.value.name !== 'Home') {
      router.push({
        name: 'Home',
      })
      return false
    }
    return true
  }

  const naviGoHome = () => {
    isBiliWeb()
    console.log(appStore.webview)
    appStore.go(START)
  }

  const goBack = () => {
    const is = isBiliWeb()
    if (is) {
      historyStore.goBack()
      return
    }
    router.back()
    resizeMainWindow()
  }

  const goForward = () => {
    isBiliWeb()
    historyStore.goForward()
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
    router.push({
      name: 'WebNav',
    })
    resizeMainWindow('mobile')
    appStore.disableDanmakuButton = true
    appStore.disablePartButton = true
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
      <button
        id="navi-back"
        title="后退"
        :disabled="!canGoBack && route.name === 'Home'"
        @click="goBack"
      >
        <Left />
      </button>
      <button
        id="navi-forward"
        title="前进"
        :disabled="!canGoForward || route.name !== 'Home'"
        @click="goForward"
      >
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
        :disabled="disableDanmakuButton"
        @click="toggleDanmaku"
      >
        弹
      </button>
      <button
        id="app-part"
        title="分P列表"
        :disabled="disablePartButton"
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
