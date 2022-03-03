<script setup lang="ts">
  import { useAppStore } from '@/store'
  import OverlayScrollbars from 'overlayscrollbars'

  const app = window.app
  const ipc = window.ipcRenderer
  const partList = ref<{
    url: string
    currentPartId: number
    parts: { id: string; title: string }[]
  }>()
  const appStore = useAppStore()
  const mainWindowID = computed(() => appStore.windowID.mainWindow)
  const scrollContainer = ref()

  const go = (index: number) => {
    if (!mainWindowID.value || !partList.value) return
    partList.value.currentPartId = index
    ipc.sendTo(
      mainWindowID.value,
      'go',
      partList.value.url.replace('%id', partList.value.parts[index].id),
    )
  }

  const closeWindow = () => {
    app.currentWindow.hide()
  }

  // 当前part滚动到可视范围
  const scrollIntoView = (animation?: boolean) => {
    document.querySelector('.current-ep')?.scrollIntoView({
      behavior: animation ? 'smooth' : 'auto',
      block: 'center',
    })
  }

  // 更新分p列表
  ipc.on('update-part', async (ev, data) => {
    if (!data) {
      app.currentWindow.hide()
      return
    }
    const lastCurrentPartId = partList.value?.currentPartId
    partList.value = data
    if (lastCurrentPartId !== partList.value?.currentPartId) {
      await nextTick()
      scrollIntoView()
    }
  })

  // 监听webview url改变
  // https://github.com/chitosai/bilimini/issues/66
  // 阿B现在支持自动跳转下一页了，这种情况下的跳转不会经过我们的代码触发_isLastNavigationSelectPart，
  // 于是会被路由当作是打开了新视频而重新获取分p，currentPartId也因此被重置回0。我们一方面在路由那边加判断来防止重复获取同一个视频的分p，
  // 另一方面每当webview加载了新的url时，就让路由把最新的url广播出来，然后这里我们监听这个事件并解析当前应该显示第几p
  ipc.on('url-changed', async (ev, url) => {
    if (!partList.value) return
    const m = /p=(\d+)/.exec(url)
    if (m) {
      partList.value.currentPartId = Number(m[1]) - 1
    } else {
      partList.value.currentPartId = 0
    }
    await nextTick()
    scrollIntoView()
  })

  onMounted(() => {
    OverlayScrollbars(scrollContainer.value, {
      scrollbars: {
        autoHide: 'leave',
        clickScrolling: true,
      },
      overflowBehavior: {
        x: 'hidden',
        y: 'scroll',
      },
    })
  })
</script>

<template>
  <div id="selectPart">
    <header class="flex p-2 drag">
      <div class="flex-1 font-bold">视频分Part</div>
      <div class="flex gap-2 no-drag">
        <b-button title="定位" @click="scrollIntoView(true)">
          <icon-target-two />
        </b-button>
        <b-button title="关闭" @click="closeWindow">
          <icon-close-small />
        </b-button>
      </div>
    </header>
    <div ref="scrollContainer" class="px-2 mb-2 h-full">
      <template v-if="partList">
        <div
          v-for="(value, index) in partList.parts"
          :key="value.id"
          v-memo="[index === partList.currentPartId]"
          class="item"
          :class="{ 'current-ep': index == partList.currentPartId }"
          :title="value.title"
          @click="index !== partList?.currentPartId && go(index)"
        >
          {{ index + 1 }}) {{ value.title || `第${index + 1}话` }}
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="less" scoped>
  #selectPart {
    display: flex;
    flex-direction: column;
    user-select: none;
    background: @color-app-bg;
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
        &::before {
          content: '●';
          margin-right: 4px;
        }
      }
      &:hover {
        opacity: 1;
        background: rgba(255, 255, 255, 0.16);
      }
    }
  }
</style>
