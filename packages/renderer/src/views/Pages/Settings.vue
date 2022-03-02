<script setup lang="ts">
  import { useAppStore } from '@/store'

  const appStore = useAppStore()
  const router = useRouter()

  const alwaysOnTop = computed<typeof appStore.alwaysOnTop>({
    get() {
      return appStore.alwaysOnTop
    },
    set(value) {
      appStore.alwaysOnTop = value
      appStore.saveConfig('alwaysOnTop', value)
    },
  })
  const goTo = (name: string) => {
    router.push({ name })
  }
</script>

<template>
  <div class="bg-$color-fill-2">
    <b-settings-tile title="窗口置顶" :separate="true">
      <a-select
        v-model="alwaysOnTop"
        :style="{ width: '120px' }"
        placeholder="Select"
        :bordered="false"
        :trigger-props="{ autoFitPopupMinWidth: true }"
      >
        <a-option value="off">关闭</a-option>
        <a-option value="on"> 开启</a-option>
        <a-option value="playing">播放视频时</a-option>
      </a-select>
    </b-settings-tile>
    <b-settings-tile title="关于 bilimini" :separate="true" @click="goTo('About')" />
  </div>
</template>
