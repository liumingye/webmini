<script setup lang="ts">
  import type { LocalPluginInfo } from '~/interfaces/plugin'
  import { useAppStore } from '@/store'

  const appStore = useAppStore()
  const router = useRouter()
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
      // console.log(_localPlugins)
    })
  })

  const open = (url: string) => {
    router.push({
      name: 'Browser',
    })
    appStore.go(url)
  }
</script>

<template>
  <div class="p-2">
    <div
      class="max-w-186 mx-auto grid justify-items-center 3sm:grid-cols-[repeat(auto-fill,25%)] 2sm:grid-cols-[repeat(auto-fill,20%)] sm:grid-cols-[repeat(auto-fill,16.666%)] grid-cols-[repeat(auto-fill,11.111%)]"
    >
      <div
        v-for="item in localPlugins"
        :key="item.name"
        class="w-16 mb-2"
        @click="open(item.start)"
      >
        <div
          class="rounded-lg shadow-md shadow-dark-100/25 mb-2 h-16 active:(filter brightness-80)"
          :style="{
            backgroundImage: `url(${item.icon})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
          }"
        ></div>
        <div class="truncate text-center text-xs">{{ item.displayName }}</div>
      </div>
    </div>
  </div>
</template>
