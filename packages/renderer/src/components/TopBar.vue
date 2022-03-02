<script setup lang="ts">
  import { useAppStore, useHistoryStore } from '@/store'
  import { resizeMainWindow } from '@/utils'
  import { START } from '@/config/constant'

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
      ' - 哔哩哔哩弹幕视频网 - ( ゜- ゜)つロ 乾杯~',
      '哔哩哔哩 (゜-゜)つロ 干杯~-',
    ]
    map.forEach((value) => {
      title = title.replace(value, '')
    })
    title = title.replace('bilibili', 'bilimini').replace('哔哩哔哩', 'bilimini')
    return title
  }

  const title = computed(() => replaceTitle(appStore.title) || 'bilimini')

  webview.value.addEventListener('page-title-updated', (event) => {
    appStore.title = event.title
    document.title = title.value
  })

  webview.value.addEventListener('dom-ready', () => {
    appStore.title = webview.value.getTitle()
    document.title = title.value
  })

  historyStore.listen((to) => {
    appStore.go(to)
  })

  const tempStore: Record<string, any> = {}
  watch(
    () => route.name,
    (newValue, oldValue) => {
      // 恢复状态
      if (newValue === 'Home') {
        appStore.autoHideBar = tempStore['autoHideBar']
        resizeMainWindow()
        return
      }
      // 保存状态
      else if (oldValue === 'Home') {
        tempStore['autoHideBar'] = appStore.autoHideBar
        appStore.autoHideBar = false
      }
    },
  )

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
      "document.querySelector('.bilibili-player-video-danmaku-switch .bui-switch-input').click()",
    )
  }

  const toggleSelectPartWindow = () => {
    ipc.send('toggle-select-part-window')
  }

  const showNav = () => {
    router.push({
      name: 'WebNav',
    })
    resizeMainWindow('mobile')
  }

  const showSettings = () => {
    router.push({
      name: 'Settings',
    })
    resizeMainWindow('mobile')
  }

  const turnOff = () => {
    ipc.send('close-main-window')
  }
</script>

<template>
  <div id="topbar" class="gap-2 items-center">
    <b-button id="navi-back" title="后退" :disabled="disableBack" @click="goBack">
      <icon-left size=".9em" />
    </b-button>
    <b-button v-if="!disableForward" title="前进" @click="goForward">
      <icon-right size=".9em" />
    </b-button>
    <b-button id="navi-home" title="返回首页" @click="naviGoHome">
      <icon-home size=".8em" />
    </b-button>
    <div class="flex-1 truncate text-center text-$color-fill-1 text-0.9em">
      {{ title }}
    </div>
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
</template>

<style lang="less" scoped>
  #topbar {
    display: flex;
    background: @color-app-bg;
    line-height: 32px;
    height: 32px;
    padding: 0 10px;
    -webkit-app-region: drag;

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
  }
</style>
