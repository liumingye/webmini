<script setup lang="ts">
  import { useAppStore } from '@/store'
  import overlayScrollbars from 'overlayscrollbars'

  const { currentWindow } = window.app
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
    console.log(partList.value.url)
  }

  const closeWindow = () => {
    currentWindow.hide()
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
    // console.log(data)
    if (!data) {
      currentWindow.hide()
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
    overlayScrollbars(scrollContainer.value, {
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
  <main id="selectPart">
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
  </main>
</template>

<style lang="less" scoped>
  #selectPart {
    display: flex;
    flex-direction: column;
    height: 100%;
    color: #fff;
    background: @color-app-bg;
    user-select: none;

    header {
      button {
        color: @color-app-bg;
        background: #fff;
      }
    }

    .item {
      padding: 0 5px;
      overflow: hidden;
      line-height: 2.4em;
      white-space: nowrap;
      text-overflow: ellipsis;
      border-radius: 4px;
      cursor: pointer;
      opacity: 0.6;
      &.current-ep {
        font-weight: bold;
        opacity: 1;
        &::before {
          margin-right: 4px;
          content: '●';
        }
      }
      &:hover {
        background: rgba(255, 255, 255, 0.16);
        opacity: 1;
      }
    }
  }
</style>
