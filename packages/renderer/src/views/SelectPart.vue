<script setup lang="ts">
import { computed, ref, nextTick } from "vue";
import { toRaw } from "@vue/reactivity";
import { useAppStore } from "@/store";

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
  window.app.currentWindow.hide();
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
    window.app.currentWindow.hide();
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

window.onerror = function (err, f, line) {
  // var id = f.split("/");
  // utils.error(`${id[id.length - 1]} : Line ${line}\n> ${err}`);
};
</script>

<template>
  <div id="selectPart">
    <span id="close" @click="closeWindow">x</span>
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
  user-select: none;
  background: #f25d8e;
  color: #ffacbf;
  font-size: 12px;
  line-height: 1.7em;
  margin: 0;
  display: flex;
  height: 100vh;
  flex-direction: column;

  #close {
    background: #fb93ab;
    border-radius: 14px;
    color: #f25d8e;
    cursor: pointer;
    display: inline-block;
    font-size: 11px;
    line-height: 13px;
    vertical-align: middle;
    margin-right: 2px;
    text-align: center;
    transition: all 0.2s ease;
    width: 14px;
    height: 14px;
    position: absolute;
    top: 10px;
    right: 5px;
  }
  #close:hover {
    background: #fff;
  }

  .row {
    padding: 5px;
    flex: 1;
    overflow-y: auto;

    .item {
      overflow-y: auto;
      border-radius: 3px;
      cursor: pointer;
      display: block;
      line-height: 2.4em;
      text-overflow: ellipsis;
      white-space: nowrap;
      padding: 0 5px;
      &.current-ep {
        color: #fff;
        font-weight: bold;
      }
      &:hover {
        background: #ea8aa1;
        color: #fff;
      }
    }
  }
  .list-title {
    padding: 6px 10px 6px;
    color: #fff;
    font-weight: bold;
    margin-right: 24px;
    -webkit-app-region: drag;
  }
}
</style>
