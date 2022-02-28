<script setup lang="ts">
  import { useAppStore } from '@/store'

  const app = window.app
  const ipc = window.ipcRenderer
  const partList = ref()
  const bangumiPartList = ref()
  const currentPartId = ref(0)
  const appStore = useAppStore()
  const mainWindowID = computed(() => appStore.windowID.mainWindow)

  const selectPart = (index: number) => {
    if (!mainWindowID.value) return
    currentPartId.value = index
    ipc.sendTo(mainWindowID.value, 'select-part', index + 1)
  }
  const selectBangumiPart = (part: { epid: number }) => {
    if (!mainWindowID.value) return
    currentPartId.value = part.epid
    ipc.sendTo(mainWindowID.value, 'select-bangumi-part', toRaw(part))
  }
  const closeWindow = () => {
    app.currentWindow.hide()
  }
  // 当前part滚动到可视范围
  const scrollIntoView = () => {
    document.querySelector('.current-ep')?.scrollIntoView({
      behavior: 'auto',
      block: 'center',
    })
  }
  // 更新分p列表
  ipc.on('update-part', (ev, data) => {
    console.log('update-part', data)
    if (!data) {
      app.currentWindow.hide()
    }
    bangumiPartList.value = null
    partList.value = data
    currentPartId.value = 0
  })
  // 番剧分p
  ipc.on('update-bangumi-part', async (ev, data) => {
    console.log('update-bangumi-part', data)
    partList.value = null
    bangumiPartList.value = data.parts
    if (currentPartId.value !== data.currentPartId) {
      currentPartId.value = data.currentPartId
      await nextTick()
      scrollIntoView()
    }
  })
  // 监听webview url改变
  // https://github.com/chitosai/bilimini/issues/66
  // 阿B现在支持自动跳转下一页了，这种情况下的跳转不会经过我们的代码触发_isLastNavigationSelectPart，
  // 于是会被路由当作是打开了新视频而重新获取分p，currentPartId也因此被重置回0。我们一方面在路由那边加判断来防止重复获取同一个视频的分p，
  // 另一方面每当webview加载了新的url时，就让路由把最新的url广播出来，然后这里我们监听这个事件并解析当前应该显示第几p
  ipc.on('url-changed', (ev, url) => {
    const m = /p=(\d+)/.exec(url)
    if (m) {
      currentPartId.value = Number(m[1]) - 1
    } else {
      currentPartId.value = 0
    }
  })
</script>

<template>
  <div id="selectPart">
    <b-button class="absolute top-3 right-3" @click="closeWindow">
      <icon-close-small />
    </b-button>
    <div class="drag pl-3 h-12 leading-12 font-bold mr-10">视频分Part</div>
    <div class="overflow-y-auto px-2 mb-2">
      <div
        v-for="(title, index) in partList"
        :key="index"
        class="item part"
        :class="{ 'current-ep': index === currentPartId }"
        :title="title"
        @click="index !== currentPartId && selectPart(index)"
      >
        <span v-show="index == currentPartId">● </span>{{ index + 1 }})
        {{ title }}
      </div>
      <div
        v-for="(part, index) in bangumiPartList"
        :key="index"
        class="item part"
        :class="{ 'current-ep': part.epid === currentPartId }"
        :title="part.title"
        @click="part.epid !== currentPartId && selectBangumiPart(part)"
      >
        <span v-show="part.epid == currentPartId">● </span>{{ part.epid + 1 }})
        {{ part.title || `第${part.epid + 1}话` }}
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
  #selectPart {
    display: flex;
    flex-direction: column;
    user-select: none;
    background: @color-bg-pink;
    color: #fff;
    height: 100%;

    .item {
      overflow: hidden;
      border-radius: 4px;
      cursor: pointer;
      line-height: 2.4em;
      text-overflow: ellipsis;
      white-space: nowrap;
      padding: 0 5px;
      opacity: 0.6;
      &.current-ep {
        opacity: 1;
        font-weight: bold;
      }
      &:hover {
        opacity: 1;
        background: rgba(255, 255, 255, 0.16);
      }
    }

    .drag {
      -webkit-app-region: drag;
    }
  }
</style>
