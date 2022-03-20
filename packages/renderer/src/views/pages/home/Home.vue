<script setup lang="ts">
  import { useAppStore } from '@/store'
  import { IconBookmark } from '@arco-design/web-vue/es/icon'
  import type { LocalPluginInfo } from '~/interfaces/plugin'

  const appStore = useAppStore()
  const router = useRouter()

  const localPlugins = computed(() => appStore.localPlugins)

  onMounted(() => {
    appStore.getLocalPlugins()
  })

  const go = (name: string | symbol) => {
    router.push({
      name: name,
    })
  }

  const open = (item: LocalPluginInfo) => {
    if (item.name === 'Router') {
      go(item.start)
    } else {
      go('Browser')
      appStore.go(item.start)
    }
  }
</script>

<template>
  <div
    class="p-2 max-w-186 mx-auto grid gap-y-3 justify-items-center 3sm:grid-cols-[repeat(auto-fill,25%)] 2sm:grid-cols-[repeat(auto-fill,20%)] sm:grid-cols-[repeat(auto-fill,16.666%)] grid-cols-[repeat(auto-fill,11.111%)]"
  >
    <div v-for="item in localPlugins" :key="item.name">
      <template v-if="item.icon">
        <div
          class="overflow-hidden mx-auto rounded-lg shadow-md shadow-dark-100/25 w-12 h-12 active:(filter brightness-80)"
          @click="open(item)"
        >
          <template v-if="item.name === 'Router'">
            <div class="w-full h-full flex justify-center items-center bg-$color-neutral-2">
              <component :is="item.icon" size="1.6rem" />
            </div>
          </template>
          <template v-else>
            <div
              class="w-full h-full bg-no-repeat bg-contain"
              :style="{
                backgroundImage: `url(${item.icon})`,
              }"
            ></div>
          </template>
        </div>
        <div class="mt-1.3 text-center truncate text-xs" @click="open(item)">{{
          item.displayName
        }}</div>
        <div class="mt-1.3 flex gap-1 justify-center">
          <template v-if="item.name !== 'Router'">
            <b-button title="导航" class="" @click.stop="">
              <IconBookmark size=".8em" />
            </b-button>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>
