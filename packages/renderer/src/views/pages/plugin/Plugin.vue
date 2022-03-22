<script setup lang="ts">
  import { useAppStore } from '@/store'
  import { Message } from '@arco-design/web-vue'
  import { cloneDeep } from 'lodash'
  import type { AdapterInfo } from '~/interfaces/plugin'
  import { PluginStatus } from '~/interfaces/plugin'

  const appStore = useAppStore()

  const loading = ref(true)

  const totalPlugins = computed(() => appStore.totalPlugins)

  const message = (content: string) => {
    Message.info({ content, position: 'bottom', closable: true })
  }

  const pluginStatusUpdate = (_e: any, _plugin: AdapterInfo, status: PluginStatus | undefined) => {
    const plugin = totalPlugins.value?.find((p) => p.name === _plugin.name)
    if (!plugin || !plugin.local) return
    switch (status) {
      case PluginStatus.INSTALLING_COMPLETE:
        message(`插件 ${plugin.name} 安装完成!`)
        appStore.getLocalPlugins()
        break
      case PluginStatus.INSTALL_FAIL:
        message(`插件 ${plugin.name} 安装失败!`)
        status = undefined
        break
      case PluginStatus.UNINSTALL_COMPLETE:
        message(`插件 ${plugin.name} 卸载完成!`)
        status = undefined
        appStore.getLocalPlugins()
        break
      case PluginStatus.UNINSTALL_FAIL:
        message(`插件 ${plugin.name} 卸载失败!`)
        status = PluginStatus.INSTALLING_COMPLETE
        break
    }
    plugin.local.status = status
  }

  onMounted(() => {
    appStore
      .getTotalPlugins()
      .then(() => {
        loading.value = false
      })
      .catch(() => {
        //
      })
    window.ipcRenderer.on('plugin-status-update', pluginStatusUpdate)
  })

  onUnmounted(() => {
    window.ipcRenderer.off('plugin-status-update', pluginStatusUpdate)
  })

  const install = (plugin: AdapterInfo) => {
    window.ipcRenderer.invoke('plugin-install', cloneDeep(plugin))
  }

  const uninstall = (plugin: AdapterInfo) => {
    window.ipcRenderer.invoke('plugin-uninstall', cloneDeep(plugin))
  }
</script>

<template>
  <div class="!bg-$color-neutral-2 p-2">
    <a-alert type="warning" class="mb-2">
      webmini需要Node.js环境，请确保安装了Node.js，并配置环境变量
    </a-alert>
    <a-list :loading="loading" :data="totalPlugins" size="small">
      <template #item="{ item }">
        <a-list-item :key="item.name">
          <a-list-item-meta>
            <template #title>
              <span class="mr-1 align-middle">{{ item.pluginName }}</span>
              <a-tag size="small">v{{ item.version }}</a-tag>
            </template>
            <template #description>
              <div class="text-xs">
                {{ item.description }}
                <br />
                {{ item.author }}
              </div>
            </template>
          </a-list-item-meta>
          <template #actions>
            <div class="ml-2">
              <template v-if="!item.local.status">
                <a-button @click="install(item)">安装</a-button>
              </template>
              <template v-else-if="item.local.status === PluginStatus.INSTALLING">
                <a-button disabled>安装中...</a-button>
              </template>
              <template v-else-if="item.local.status === PluginStatus.INSTALLING_COMPLETE">
                <a-button @click="uninstall(item)">卸载</a-button>
              </template>
              <template v-else-if="item.local.status === PluginStatus.UNINSTALLING">
                <a-button disabled>卸载中...</a-button>
              </template>
            </div>
          </template>
        </a-list-item>
      </template>
    </a-list>
  </div>
</template>

<style lang="less" scoped>
  :deep(.arco-list) {
    background: var(--color-bg-2);
  }
</style>
