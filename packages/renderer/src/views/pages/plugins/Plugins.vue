<script setup lang="ts">
  import { useRequest } from 'vue-request'
  import { fetchTotalPlugins } from '@/apis/plugin'

  const totalPlugins = ref([])

  const { run } = useRequest(fetchTotalPlugins, {
    formatResult: (res: any) => {
      return res.data === undefined ? [] : res.data
    },
    onSuccess: (res) => {
      totalPlugins.value = res
    },
  })
  run()
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
          <a-button>安装</a-button>
        </template>
      </a-list-item>
    </a-list>
  </div>
</template>
