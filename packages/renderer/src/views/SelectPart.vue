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
    console.log(data)
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

  ipc.on('update-currentPartId', async (ev, data) => {
    if (!partList.value) return
    partList.value.currentPartId = data
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
