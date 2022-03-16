<script setup lang="ts">
  import type { LocalPluginInfo } from '~/interfaces/plugin'
  const localPlugins = ref<LocalPluginInfo[]>()
  onMounted(() => {
    window.ipcRenderer.invoke('get-local-plugins').then((_localPlugins: LocalPluginInfo[]) => {
      localPlugins.value = _localPlugins
      // localPlugins.value.push(_localPlugins[0])
      // localPlugins.value.push(_localPlugins[0])
      // localPlugins.value.push(_localPlugins[0])
      // localPlugins.value.push(_localPlugins[0])
      // localPlugins.value.push(_localPlugins[0])
      // localPlugins.value.push(_localPlugins[0])
      // localPlugins.value.push(_localPlugins[0])
      // localPlugins.value.push(_localPlugins[0])
      // localPlugins.value.push(_localPlugins[0])
      console.log(_localPlugins)
    })
  })
</script>

<template>
  <div class="p-2">
    <div
      class="max-w-186 mx-auto grid justify-items-center 3sm:grid-cols-[repeat(auto-fill,25%)] 2sm:grid-cols-[repeat(auto-fill,20%)] sm:grid-cols-[repeat(auto-fill,16.666%)] grid-cols-[repeat(auto-fill,11.111%)]"
    >
      <div v-for="item in localPlugins" :key="item.name" class="w-16 mb-2">
        <img :src="item.icon" class="rounded-lg shadow-md shadow-dark-100/25 mb-2" />
        <div class="truncate text-center">{{ item.displayName }}</div>
      </div>
    </div>
  </div>
</template>
