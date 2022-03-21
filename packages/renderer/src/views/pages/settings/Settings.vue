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

  // const switchTest = ref(false)

  const clearSensitiveDirectories = () => {
    window.ipcRenderer.send('clear-sensitive-directories')
  }

  const clearAllUserData = () => {
    window.ipcRenderer.send('clear-all-user-data')
  }
</script>

<template>
  <div class="py-0.01 !bg-$color-neutral-2">
    <b-settings>
      <b-settings-tile v-model="alwaysOnTop" title="窗口置顶" type="select">
        <a-option value="off">关闭</a-option>
        <a-option value="on">开启</a-option>
        <a-option value="playing">播放视频时</a-option>
      </b-settings-tile>
      <!-- <b-settings-tile v-model="switchTest" title="测试" type="switch" /> -->
    </b-settings>
    <b-settings>
      <b-settings-tile title="关于 webmini" type="router" @click="router.push({ name: 'About' })" />
      <b-settings-tile title="清理缓存" @click="clearSensitiveDirectories" />
      <b-settings-tile title="重置应用" @click="clearAllUserData" />
    </b-settings>
  </div>
</template>
