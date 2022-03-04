<script setup lang="ts">
  import { useAppStore } from '@/store'
  const appStore = useAppStore()
  window.ipcRenderer.on('windowID', (_event, items) => {
    Object.assign(appStore.windowID, items)
  })
  // appStore Init
  appStore.init()
</script>

<template>
  <router-view v-slot="{ Component }">
    <component :is="Component" />
  </router-view>
</template>

<style>
  #app {
    height: 100%;
    user-select: none;
    overflow: hidden;
  }
</style>
