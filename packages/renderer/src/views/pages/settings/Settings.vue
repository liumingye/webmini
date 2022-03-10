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
      appStore.saveConfig({ alwaysOnTop: value })
    },
  })
  const clearSensitiveDirectories = () => {
    window.ipcRenderer.send('clear-sensitive-directories')
  }
  const clearAllUserData = () => {
    window.ipcRenderer.send('clear-all-user-data')
  }
</script>

<template>
  <div class="bg-$color-neutral-2 inline-block">
    <b-settings>
      <b-settings-tile title="窗口置顶">
        <a-select
          v-model="alwaysOnTop"
          :style="{ width: '120px' }"
          placeholder="Select"
          :bordered="false"
          :trigger-props="{ autoFitPopupMinWidth: true }"
        >
          <a-option value="off">关闭</a-option>
          <a-option value="on">开启</a-option>
          <a-option value="playing">播放视频时</a-option>
        </a-select>
      </b-settings-tile>
    </b-settings>
    <b-settings>
      <b-settings-tile title="关于 bilimini" @click="router.push({ name: 'About' })" />
      <b-settings-tile title="清理缓存" @click="clearSensitiveDirectories" />
      <b-settings-tile title="重置应用" @click="clearAllUserData" />
    </b-settings>
  </div>
</template>
