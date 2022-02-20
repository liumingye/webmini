<script setup lang="ts">
import { ref, computed } from "vue";
import { useAppStore } from "@/store";

import {
  Home,
  Left,
  Right,
  Windmill,
  CloseSmall,
  Help,
} from "@/components/Icon";

const ipc = window.ipcRenderer;
const appStore = useAppStore();
const webview = computed(() => appStore.webview);
const canGoBack = computed(() => appStore.canGoBack);
const canGoForward = computed(() => appStore.canGoForward);
const disableDanmakuButton = computed(() => appStore.disableDanmakuButton);
const disablePartButton = computed(() => appStore.disablePartButton);
const title = computed(() => appStore.title);
const goBack = () => webview.value.goBack();
const goForward = () => webview.value.goForward();
const naviGoHome = () => {
  appStore.go("https://m.bilibili.com/index.html");
};
const naviGotoShow = () => {
  appStore.showGotoTarget = true;
};
const toggleDanmaku = () => {
  webview.value.executeJavaScript(
    `document.querySelector('.bilibili-player-video-danmaku-switch .bui-switch-input').click()`
  );
};
const toggleSelectPartWindow = () => {
  console.log("主窗口：点击P");
  ipc.send("toggle-select-part-window");
};
const showFeed = () => {
  appStore.go("https://t.bilibili.com/?tab=8");
};
const showAbout = () => {
  appStore.showAbout = !appStore.showAbout;
};
const turnOff = () => {
  ipc.send("close-main-window");
};
</script>

<template>
  <div id="topbar">
    <div class="button-group">
      <button
        id="navi-back"
        title="后退"
        :disabled="!canGoBack"
        @click="goBack"
      >
        <Left />
      </button>
      <button
        id="navi-forward"
        title="前进"
        :disabled="!canGoForward"
        @click="goForward"
      >
        <Right />
      </button>
      <button id="navi-home" title="返回首页" @click="naviGoHome">
        <Home />
      </button>
      <button id="navi-goto" title="前往..." @click="naviGotoShow">av</button>
    </div>
    <div class="title">
      {{ title }}
    </div>
    <div class="button-group">
      <button
        id="app-danmaku"
        title="开/关弹幕"
        @click="toggleDanmaku"
        :disabled="disableDanmakuButton"
      >
        弹
      </button>
      <button
        id="app-part"
        title="分P列表"
        @click="toggleSelectPartWindow"
        :disabled="disablePartButton"
      >
        P
      </button>
      <button title="动态" @click="showFeed">
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
      &#navi-goto {
        border-radius: 3px;
        font-size: 14px;
        padding: 0 5px;
        width: auto;
      }
      &#app-danmaku,
      &#app-part {
        font-size: 10px;
      }
    }
  }
}
</style>
