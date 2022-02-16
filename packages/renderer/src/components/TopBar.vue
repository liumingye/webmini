<script setup lang="ts">
import { ref, computed } from "vue";
import { useAppStore } from "@/store";

const ipc = window.ipcRenderer;
const appStore = useAppStore();
const webview = computed(() => appStore.webview);
const canGoBack = ref(false);
const canGoForward = ref(false);
const disableDanmakuButton = computed(() => appStore.disableDanmakuButton);
const disablePartButton = computed(() => appStore.disablePartButton);

webview.value.addEventListener("did-finish-load", () => updateNavState());
webview.value.addEventListener("did-navigate-in-page", () => updateNavState());

const updateNavState = () => {
  canGoBack.value = webview.value.canGoBack();
  canGoForward.value = webview.value.canGoForward();
};

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
  console.log(disablePartButton.value);
  // if (this.disablePartButton) {
  // return false;
  // }
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
        class="top-btn"
        :disabled="!canGoBack"
        @click="goBack"
      >
        ◀
      </button>
      <button
        id="navi-forward"
        title="前进"
        class="top-btn"
        :disabled="!canGoForward"
        @click="goForward"
      >
        ▶
      </button>
      <button
        id="navi-home"
        title="返回首页"
        class="top-btn"
        @click="naviGoHome"
      ></button>
      <button
        id="navi-goto"
        title="前往..."
        class="top-btn"
        @click="naviGotoShow"
      >
        av
      </button>
    </div>
    <div class="button-group">
      <button
        id="app-danmaku"
        title="开/关弹幕"
        class="top-btn"
        @click="toggleDanmaku"
        :disabled="disableDanmakuButton"
      >
        弹
      </button>
      <button
        id="app-part"
        title="分P列表"
        class="top-btn"
        @click="toggleSelectPartWindow"
        :disabled="disablePartButton"
      >
        P
      </button>
      <button
        id="app-feed"
        title="动态"
        class="top-btn"
        @click="showFeed"
      ></button>
      <!-- <span
        id="app-config"
        title="设置"
        class="top-btn"
        alt="toggleConfig"
      ></span> -->
      <button id="app-about" title="关于" class="top-btn" @click="showAbout">
        ?
      </button>
      <button id="app-close" title="退出" class="top-btn" @click="turnOff">
        x
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
}
.button-group {
  grid-gap: 6px;
  gap: 6px;
  display: flex;
  align-items: center;
}
.top-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  -webkit-app-region: no-drag;
  border-radius: 100%;
  font-size: 7px;
  width: 15px;
  height: 15px;
  text-align: center;
  background: @color-bg-white;
  opacity: 0.5;
  color: @color-bg-pink;
  cursor: pointer;
  transition: opacity 0.2s ease;
  background-position: 2px 2px;
  background-repeat: no-repeat;
  background-size: 11px;

  &[disabled] {
    opacity: 0.2;
  }

  &:not([disabled]):hover {
    opacity: 1;
  }
}
#navi-back {
  text-indent: -1px;
}
#navi-forward {
  text-indent: 1px;
}
#navi-home {
  background-image: url("@/assets/images/home.png");
}
#app-feed {
  background-image: url("@/assets/images/feed.png");
}
#app-config {
  background-image: url("@/assets/images/config.png");
}
#navi-goto {
  border-radius: 3px;
  font-size: 14px;
  padding: 0 5px;
  width: auto;
}
#app-danmaku,
#app-part {
  font-size: 10px;
}
#app-about {
  font-size: 12px;
}
#app-close {
  font-size: 13px;
  line-height: 12px;
}
</style>
