<script setup lang="ts">
import { computed, ref, nextTick } from "vue";
import { toRaw } from "@vue/reactivity";
import { useAppStore } from "@/store";

const app = window.app;
const ipc = window.ipcRenderer;
const partList = ref();
const bangumiPartList = ref();
const currentPartId = ref(0);
const appStore = useAppStore();
const mainWindowID = computed(() => appStore.windowID.mainWindow);

const selectPart = (index: number) => {
  if (!mainWindowID.value) return;
  currentPartId.value = index;
  ipc.sendTo(mainWindowID.value, "select-part", index + 1);
};
const selectBangumiPart = (part: { epid: number }) => {
  if (!mainWindowID.value) return;
  currentPartId.value = part.epid;
  ipc.sendTo(mainWindowID.value, "select-bangumi-part", toRaw(part));
};
const closeWindow = () => {
  app.currentWindow.hide();
};
// 当前part滚动到可视范围
const scrollIntoView = () => {
  document.querySelector(".current-ep")?.scrollIntoView({
    behavior: "auto",
    block: "center",
  });
};
// 更新分p列表
ipc.on("update-part", (ev, arg) => {
  if (!arg) {
    app.currentWindow.hide();
  }
  currentPartId.value = 0;
  partList.value = arg;
  bangumiPartList.value = null;
  nextTick(() => {
    scrollIntoView();
  });
});
// 番剧分p
ipc.on("update-bangumi-part", (ev, data) => {
  console.log("update-bangumi-part", data);
  currentPartId.value = data.currentPartId;
  partList.value = null;
  bangumiPartList.value = data.parts;
  nextTick(() => {
    scrollIntoView();
  });
});
// 监听webview url改变
// https://github.com/chitosai/bilimini/issues/66
// 阿B现在支持自动跳转下一页了，这种情况下的跳转不会经过我们的代码触发_isLastNavigationSelectPart，
// 于是会被路由当作是打开了新视频而重新获取分p，currentPartId也因此被重置回0。我们一方面在路由那边加判断来防止重复获取同一个视频的分p，
// 另一方面每当webview加载了新的url时，就让路由把最新的url广播出来，然后这里我们监听这个事件并解析当前应该显示第几p
ipc.on("url-changed", (ev, url) => {
  const m = /p\=(\d+)/.exec(url);
  if (m) {
    currentPartId.value = Number(m[1]) - 1;
  } else {
    currentPartId.value = 0;
  }
});

// window.onerror = function (err, f, line) {
// var id = f.split("/");
// utils.error(`${id[id.length - 1]} : Line ${line}\n> ${err}`);
// };
</script>

<template>
  <div id="selectPart">
    <button id="close" @click="closeWindow">x</button>
    <div class="list-title">视频分Part</div>
    <div class="row">
      <div
        class="item part"
        :class="{ 'current-ep': index === currentPartId }"
        v-for="(title, index) in partList"
        :key="index"
        :title="title"
        @click="selectPart(index)"
      >
        <span v-show="index == currentPartId">● </span>{{ index + 1 }})
        {{ title }}
      </div>
      <div
        class="item part"
        :class="{ 'current-ep': part.epid === currentPartId }"
        v-for="(part, index) in bangumiPartList"
        :key="index"
        :title="part.title"
        @click="selectBangumiPart(part)"
      >
        <span v-show="part.epid == currentPartId">● </span>{{ part.epid + 1 }})
        {{ part.title }}
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

  #close {
    background: @color-bg-white;
    color: @color-bg-pink;
    opacity: 0.6;
    border-radius: 14px;
    cursor: pointer;
    font-size: 12px;
    text-align: center;
    transition: opacity 0.2s ease;
    width: 15px;
    height: 15px;
    line-height: 15px;
    position: absolute;
    top: 12px;
    right: 10px;
  }
  #close:hover {
    opacity: 1;
  }

  .row {
    padding: 0 5px;
    overflow-y: auto;

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
  }
  .list-title {
    padding-left: 10px;
    height: 36px;
    line-height: 36px;
    color: #fff;
    font-weight: bold;
    margin-right: 24px;
    -webkit-app-region: drag;
  }
}
</style>
