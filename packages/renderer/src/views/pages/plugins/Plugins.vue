<script setup lang="ts">
  import { useRequest } from 'vue-request'
  import { fetchTotalPlugins } from '@/apis/plugin'
  import { type AdapterInfo, PluginStatus } from '~/interfaces/plugin'

  const loading = ref(true)

  const totalPlugins = ref<AdapterInfo[]>()

  const pluginStatusUpdate = (e: any, _plugin: AdapterInfo, _status: PluginStatus | undefined) => {
    const plugin = totalPlugins.value?.find((p) => p.name === _plugin.name)
    if (!plugin) return
    let status = _status
    switch (_status) {
      case PluginStatus.INSTALL_FAIL:
        status = undefined
        break
      case PluginStatus.UNINSTALL_COMPLETE:
        status = undefined
        break
      case PluginStatus.UNINSTALL_FAIL:
        status = PluginStatus.INSTALLING_COMPLETE
        break
    }
    plugin.status = status
  }

  onMounted(() => {
    window.ipcRenderer.invoke('get-local-plugins').then((localPlugins: Record<string, string>) => {
      const { run } = useRequest(fetchTotalPlugins, {
        formatResult: (res: any) => {
          return res.data === undefined ? [] : res.data
        },
        onSuccess: (res) => {
          totalPlugins.value = res.map((_res: AdapterInfo) => {
            _res.status = undefined
            if (localPlugins[_res.name]) {
              _res.status = localPlugins[_res.name] as PluginStatus
            }
            return _res
          })
          loading.value = false
          // console.log(totalPlugins.value)
        },
      })
      run()
    })
    window.ipcRenderer.on('plugin-status-update', pluginStatusUpdate)
  })

  onUnmounted(() => {
    window.ipcRenderer.off('plugin-status-update', pluginStatusUpdate)
  })

  const install = (_plugin: AdapterInfo) => {
    window.ipcRenderer.invoke('plugin-install', _plugin)
  }

  const uninstall = (_plugin: AdapterInfo) => {
    window.ipcRenderer.invoke('plugin-uninstall', _plugin)
  }
</script>

<template>
  <div class="!bg-$color-neutral-2 p-3">
    <a-list :loading="loading" :data="totalPlugins" size="small">
      <template #item="{ item }">
        <a-list-item :key="item.name">
          <a-list-item-meta>
            <template #title>
              <span class="mr-1">{{ item.pluginName }}</span>
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
              <template v-if="!item.status">
                <a-button @click="install(item)">安装</a-button>
              </template>
              <template v-else-if="item.status === PluginStatus.INSTALLING">
                <a-button disabled>安装中...</a-button>
              </template>
              <template v-else-if="item.status === PluginStatus.INSTALLING_COMPLETE">
                <a-button @click="uninstall(item)">卸载</a-button>
              </template>
              <template v-else-if="item.status === PluginStatus.UNINSTALLING">
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
