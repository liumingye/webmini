<script setup lang="ts">
import TopBar from "@/components/TopBar.vue";
import BiliWeb from "@/components/BiliWeb.vue";
import GotoTarget from "@/components/GoTarget.vue";
import About from "@/components/About.vue";

import { useAppStore } from "@/store";
import { ref, onMounted, computed, watch } from "vue";
import { currentWindowType } from "@/utils";
import { debounce } from "@/utils/debounce";

const appStore = useAppStore();
const showTopBar = ref(true);
const mounted = ref(false);
const showGotoTarget = computed(() => appStore.showGotoTarget);
const showAbout = computed(() => appStore.showAbout);

const app = window.app;

// windows下frameless window没法正确检测到mouseout事件，只能根据光标位置做个dirtyCheck了
const initMouseStateDirtyCheck = () => {
  const lastStatus = ref<"OUT" | "IN">();
  const timeout = ref();
  const Fn = () => {
    const getMousePosition = app.remote.screen.getCursorScreenPoint,
      mousePos = getMousePosition(),
      windowPos = app.currentWindow.getPosition(),
      windowSize = app.currentWindow.getSize();
    const getTriggerAreaWidth = () => {
      return lastStatus.value == "IN" ? 0 : 16;
    };
    const getTriggerAreaHeight = () => {
      let h = 0.1 * windowSize[1],
        minHeight = lastStatus.value == "IN" ? 120 : 36;
      return h > minHeight ? h : minHeight;
    };
    if (
      mousePos.x > windowPos[0] &&
      mousePos.x < windowPos[0] + windowSize[0] - getTriggerAreaWidth() &&
      mousePos.y > windowPos[1] &&
      mousePos.y < windowPos[1] + getTriggerAreaHeight()
    ) {
      if (lastStatus.value == "OUT") {
        showTopBar.value = true;
        lastStatus.value = "IN";
      }
      return;
    }
    lastStatus.value = "OUT";
    showTopBar.value = false;
  };
  watch(
    () => appStore.autoHideBar,
    (autoHideBar) => {
      if (autoHideBar) {
        timeout.value = setInterval(Fn, 200);
        return;
      }
      clearInterval(timeout.value);
      showTopBar.value = true;
    }
  );
};

// 当用户缩放窗口时保存窗口尺寸
const saveWindowSizeOnResize = () => {
  const debounced = debounce(() => {
    const _currentWindowType = currentWindowType.value;
    if (
      !["windowSizeMini", "windowSizeFeed", "windowSizeDefault"].includes(
        _currentWindowType
      )
    ) {
      return;
    }
    const currentSize = appStore[_currentWindowType];
    const newSize: [number, number] = [window.innerWidth, window.innerHeight];
    if (currentSize !== newSize) {
      appStore[_currentWindowType] = newSize;
      appStore.saveSelfToLocalStorage();
    }
  }, 300);
  window.addEventListener("resize", () => {
    debounced();
  });
};

onMounted(() => {
  mounted.value = true;
  initMouseStateDirtyCheck();
  saveWindowSizeOnResize();
});
</script>

<template>
  <div id="main" :class="{ showTopBar, showAbout }">
    <TopBar v-if="mounted" />
    <keep-alive>
      <About v-if="showAbout" />
    </keep-alive>
    <BiliWeb />
    <GotoTarget v-if="showGotoTarget" />
  </div>
</template>

<style lang="less" scoped>
#main {
  transition: all 0.2s ease;
  height: 100%;
  margin-top: -36px;
  &.showTopBar {
    margin-top: 0;
  }
  &.showAbout {
    margin-top: 176px;
  }
}
</style>
