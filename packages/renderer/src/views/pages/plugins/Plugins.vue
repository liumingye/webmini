<script setup lang="ts">
  import { useRequest } from 'vue-request'
  import { fetchTotalPlugins } from '@/apis/plugin'
  import { AdapterInfo, PluginStatus, pluginInfo } from '~/interfaces/plugin'

  const totalPlugins = ref<AdapterInfo[]>()

  onMounted(() => {
    window.ipcRenderer.invoke('get-local-plugins').then((localPlugins: Record<string, string>) => {
      const { run } = useRequest(fetchTotalPlugins, {
        formatResult: (res: any) => {
          return res.data === undefined ? [] : res.data
        },
        onSuccess: (res) => {
          totalPlugins.value = res.map((_res: { name: string; status: string }) => {
            if (localPlugins[_res.name]) {
              _res.status = localPlugins[_res.name]
            }
            return _res
          })
          console.log(totalPlugins.value)
        },
      })
      run()
    })

    window.ipcRenderer.on('plugin-status-update', (e, _plugin, _status) => {
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
      const plugin = totalPlugins.value?.find((x) => x.name === _plugin.name)
      if (!plugin) return
      plugin.status = status
    })
  })

  const install = (plugin: pluginInfo) => {
    window.ipcRenderer.invoke('plugin-install', plugin)
  }

  const uninstall = (plugin: pluginInfo) => {
    window.ipcRenderer.invoke('plugin-uninstall', plugin)
  }
</script>

<template>
  <div class="px-2 py-4">
    <a-list class="bg-$color-bg-2">
      <a-list-item v-for="(value, index) in totalPlugins" :key="index">
        <a-list-item-meta
          :title="`${value.pluginName} v${value.version}`"
          :description="value.description"
        />
        <template #actions>
          <template v-if="!value.status">
            <a-button @click="install({ name: value.name })">安装</a-button>
          </template>
          <template v-else-if="value.status === PluginStatus.INSTALLING">
            <a-button disabled>安装中...</a-button>
          </template>
          <template v-else-if="value.status === PluginStatus.INSTALLING_COMPLETE">
            <a-button @click="uninstall({ name: value.name })">卸载</a-button>
          </template>
          <template v-else-if="value.status === PluginStatus.UNINSTALLING">
            <a-button disabled>卸载中...</a-button>
          </template>
        </template>
      </a-list-item>
    </a-list>
  </div>
</template>
