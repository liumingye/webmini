<script setup lang="ts">
  import { computed } from 'vue'
  import { useAppStore, useHistoryStore } from '@/store'
  import { resizeMainWindow } from '@/utils'
  import { START } from '@/utils/constant'
  import { useRoute, useRouter } from 'vue-router'

  const ipc = window.ipcRenderer
  const appStore = useAppStore()
  const route = useRoute()
  const router = useRouter()
  const historyStore = useHistoryStore()
  const webview = computed(() => appStore.webview)
  const disableDanmakuButton = computed(() => appStore.disableDanmakuButton)
  const disablePartButton = computed(() => appStore.disablePartButton)

  const replaceTitle = (title: string) => {
    const map = [
      '_哔哩哔哩_bilibili',
      '-高清正版在线观看-bilibili-哔哩哔哩',
      ' - 哔哩哔哩弹幕视频网 - ( ゜- ゜)つロ 乾杯~ - bilibili',
      '-哔哩哔哩 (゜-゜)つロ 干杯~-bilibili',
    ]
    map.forEach((value) => {
      title = title.replace(value, '')
    })
    return title
  }

  const title = computed(() => replaceTitle(appStore.title))

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
    // console.log('主窗口：点击P')
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
      <b-button id="navi-back" title="后退" :disabled="disableBack" @click="goBack">
        <icon-left />
      </b-button>
      <b-button v-if="!disableForward" title="前进" @click="goForward">
        <icon-right />
      </b-button>
      <b-button id="navi-home" title="返回首页" @click="naviGoHome">
        <icon-home />
      </b-button>
    </div>
    <div class="title">
      {{ title }}
    </div>
    <div class="button-group">
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
        <icon-windmill />
      </b-button>
      <b-button title="关于" @click="showAbout">
        <icon-help />
      </b-button>
      <b-button title="退出" @click="turnOff">
        <icon-close-small />
      </b-button>
    </div>
  </div>
</template>

<style lang="less" scoped>
  #topbar {
    user-select: none;
    display: flex;
    background: @color-bg-pink;
    line-height: 36px;
    height: 36px;
    padding: 0 1em;
    width: 100%;
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

      #navi-back {
        span {
          :deep(svg) {
            margin-left: -2px;
          }
        }
      }
      #app-danmaku,
      #app-part {
        font-size: 10px;
      }
    }
  }
</style>
