<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useAppStore } from "@/store";
import { resizeMainWindow } from "@/utils";
import { getVid, getVidWithP, getPartOfBangumi, getPartOfVideo } from "@/utils";
import { userAgent, liveUrlPrefix } from "@/utils/constant";

const ipc = window.ipcRenderer;
const appStore = useAppStore();
const _webview = ref<Electron.WebviewTag>();
const showLoding = computed(() => appStore.showLoding);

const preload = window.app.preload;

onMounted(() => {
  appStore.webview = _webview.value!;
  const webview = computed(() => appStore.webview);

  webview.value.addEventListener("new-window", (e) => {
    console.log(`触发 new-window 事件，目标: ${e.url}`);
    appStore.go(e.url);
  });

  let lastVid: string;
  let lastLoadedUrl: string;

  webview.value.addEventListener("did-finish-load", () => {
    // didFinishLoad();
    // 关闭loading遮罩
    appStore.showLoding = false;
  });

  webview.value.addEventListener("load-commit", () => {
    // console.log(`触发 load-commit 事件，当前url是: ${url}`);
    const url = webview.value.getURL();
    console.log(`触发 load-commit 事件，当前url是: ${url}`);
    if (lastLoadedUrl === url) {
      return;
    }
    lastLoadedUrl = url;
    appStore.changeUrl(url);
    // 改变窗口尺寸
    resizeMainWindow();

    const vid = getVid(url);
    if (vid) {
      // 现在存在同一个视频自动跳下一p的可能，这时也会触发路由重新加载页面，但是这时不应该重新获取分p数据
      if (vid !== lastVid) {
        getPartOfVideo(vid);
        lastVid = vid;
      }
    } else if (url.indexOf("www.bilibili.com/bangumi/play/") > -1) {
      getPartOfBangumi(url);
    }
  });

  // 收到选p消息时跳p
  ipc.on("select-part", (ev, pid) => {
    appStore.goPart(pid);
  });
  ipc.on("select-bangumi-part", (ev, ep) => {
    appStore.goBangumiPart(ep);
  });
  ipc.on("openWebviewDevTools", () => {
    webview.value.openDevTools();
  });
  // 用户按↑、↓键时，把事件传递到webview里去实现修改音量功能
  ipc.on("change-volume", (ev, arg) => {
    webview.value.send("change-volume", arg);
  });
  // 按下ESC键
  ipc.on("press-esc", (ev) => {
    webview.value.goBack();
  });
});
</script>

<template>
  <component
    :class="{ filter: showLoding }"
    ref="_webview"
    is="webview"
    src="https://m.bilibili.com/index.html"
    :useragent="userAgent.mobile"
    :preload="preload"
    webpreferences="nativeWindowOpen=no"
  />
</template>

<style lang="less" scoped>
webview {
  width: 100%;
  height: 100%;

  &.filter {
    filter: blur(5px);
  }
}
</style>
