<script setup lang="ts">
  import { fetchTotalPlugins } from '@/apis/plugin'
  import { cloneDeep } from 'lodash'
  import { useRequest } from 'vue-request'
  import type { AdapterInfo, LocalPluginInfo } from '~/interfaces/plugin'
  import { PluginStatus } from '~/interfaces/plugin'

  const loading = ref(true)

  const totalPlugins = ref<AdapterInfo[]>()

  const pluginStatusUpdate = (_e: any, _plugin: AdapterInfo, _status: PluginStatus | undefined) => {
    const plugin = totalPlugins.value?.find((p) => p.name === _plugin.name)
    if (!plugin || !plugin.local) return
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
    plugin.local.status = status
  }

  onMounted(() => {
    window.ipcRenderer.invoke('get-local-plugins').then((localPlugins: LocalPluginInfo[]) => {
      const { run } = useRequest(fetchTotalPlugins, {
        formatResult: (res: any) => {
          return res.data === undefined ? [] : res.data
        },
        onSuccess: (res) => {
          totalPlugins.value = res.map((_res: AdapterInfo) => {
            const localPlugin = localPlugins.find((p) => p.name === _res.name)
            if (!localPlugin) {
              // 本地不存在
              _res.local = {} as LocalPluginInfo
              _res.local.status = undefined
            } else {
              // 本地存在
              _res.local = localPlugin
              // 防止状态卡在ing中
              if (_res.local?.status === PluginStatus.UNINSTALLING) {
                _res.local.status = PluginStatus.INSTALLING_COMPLETE
              } else if (_res.local?.status === PluginStatus.INSTALLING) {
                _res.local.status = undefined
              }
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

  const install = (plugin: AdapterInfo) => {
    console.log(plugin)
    window.ipcRenderer.invoke('plugin-install', cloneDeep(plugin))
  }

  const uninstall = (plugin: AdapterInfo) => {
    console.log(plugin)
    window.ipcRenderer.invoke('plugin-uninstall', cloneDeep(plugin))
  }
</script>

<template>
  <div class="!bg-$color-neutral-2 p-3">
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
