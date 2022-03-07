<script setup lang="ts">
  import { useAppStore } from '@/store'

  const appStore = useAppStore()

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
    window.ipcRenderer.send('clearSensitiveDirectories')
  }
  const clearAllUserData = () => {
    window.ipcRenderer.send('clearAllUserData')
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
      <router-link :to="{ name: 'About' }">
        <b-settings-tile title="关于 bilimini" />
      </router-link>
      <b-settings-tile title="清理缓存" @click="clearSensitiveDirectories" />
      <b-settings-tile title="重置应用" @click="clearAllUserData" />
    </b-settings>
  </div>
</template>
