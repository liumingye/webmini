<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useAppStore } from "@/store";

const appStore = useAppStore();
const showLoading = computed(() => appStore.showLoding);
</script>

<template>
  <div
    id="loading"
    :class="{
      show: showLoading,
    }"
  ></div>
</template>

<style lang="less" scoped>
#loading {
  background: url("@/assets/images/loading.gif") center no-repeat
    rgba(255, 255, 255, 0.75);
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  transition: transform 0.2s ease;
  z-index: 8;
  transform: scale3d(2, 2, 2);
  visibility: hidden;
  &.show {
    visibility: visible;
    transform: scale3d(1, 1, 1);
  }
}
</style>
