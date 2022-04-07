<script setup lang="ts">
  import { useAppStore } from '@/store'
  import { merge } from 'lodash'

  const appStore = useAppStore()
  window.ipcRenderer.once('windowID', (_event, items) => {
    merge(appStore.windowID, items)
  })
  // appStore Init
  appStore.init()
</script>

<template>
  <router-view v-slot="{ Component }">
    <component :is="Component" />
  </router-view>
</template>

<style lang="less">
  #app {
    height: 100%;
    overflow: hidden;
    user-select: none;
  }
</style>
