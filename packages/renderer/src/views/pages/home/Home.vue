<script setup lang="ts">
  import { useAppStore } from '@/store'
  import type { LocalPluginInfo } from '~/interfaces/plugin'
  import { IconBookmark } from '@arco-design/web-vue/es/icon'

  const appStore = useAppStore()
  const router = useRouter()
  const localPlugins = ref<LocalPluginInfo[]>()

  onMounted(() => {
    window.ipcRenderer.invoke('get-local-plugins').then((_localPlugins: LocalPluginInfo[]) => {
      localPlugins.value = _localPlugins
      localPlugins.value.push(_localPlugins[0])
      localPlugins.value.push(_localPlugins[0])
      localPlugins.value.push(_localPlugins[0])
      localPlugins.value.push(_localPlugins[0])
      localPlugins.value.push(_localPlugins[0])
      localPlugins.value.push(_localPlugins[0])
      localPlugins.value.push(_localPlugins[0])
      localPlugins.value.push(_localPlugins[0])
      localPlugins.value.push(_localPlugins[0])
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
        class="w-16 mb-3"
        @click="open(item.start)"
      >
        <div
          class="mx-auto rounded-lg shadow-md shadow-dark-100/25 w-12 h-12 active:(filter brightness-80)"
          :style="{
            backgroundImage: `url(${item.icon})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
          }"
        ></div>
        <div class="mt-1 text-center truncate text-xs">{{ item.displayName }}</div>
        <div class="mt-1 flex gap-1 justify-center">
          <b-button title="进入" class="">
            <IconBookmark size=".8em" @click.stop="open(item.start)" />
          </b-button>
          <b-button title="导航" class="" @click.stop="">
            <IconBookmark size=".8em" />
          </b-button>
        </div>
      </div>
    </div>
  </div>
</template>
