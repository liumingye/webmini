<script setup lang="ts">
  import { useAppStore, useTabsStore } from '@/store'
  import { resizeMainWindow } from '@/utils'

  const route = useRoute()
  const router = useRouter()
  const appStore = useAppStore()
  const tabsStore = useTabsStore()

  type Search = {
    link: string
    placeholder?: string
    links?: {
      test: RegExp
      link: string
    }[]
  }

  type Nav = Record<
    string,
    {
      name: string
      url: string
    }[]
  >

  type Replace = {
    search: string
    replace: string
  }[]

  const search = ref<Search>()
  const nav = ref<Nav>()
  const replace = ref<Replace>()

  onActivated(() => {
    search.value = nav.value = replace.value = undefined

    const { pluginName } = route.params

    window.ipcRenderer.invoke('plugin-get-data', pluginName, 'webNav').then((data) => {
      console.log(data)
      if (data.search) {
        search.value = data.search
      }
      if (data.nav) {
        nav.value = data.nav
      }
      if (data.replace) {
        replace.value = data.replace
      }
    })
  })

  const open = async (url: string) => {
    let newUrl = url
    // 将链接中的${}替换为真正的值
    replace.value?.forEach((item) => {
      newUrl = newUrl.replaceAll(item.search, item.replace)
    })
    if (newUrl === tabsStore.getFocusedTab()?.url) {
      resizeMainWindow()
    } else {
      appStore.go(newUrl)
    }
    router.push({
      name: 'Browser',
    })
  }

  const naviGotoTarget = ref('')

  const naviGoto = () => {
    if (!search.value) return

    const value = naviGotoTarget.value

    // 特殊搜索
    if (search.value.links) {
      try {
        search.value.links.forEach((item) => {
          if (item.test.test(value)) {
            open(item.link.replace('%s', value))
            throw new Error() // 终止循环
          }
        })
      } catch (error) {
        return
      }
    }

    // 默认搜索
    if (search.value.link) {
      open(search.value.link.replace('%s', value))
    }
  }
</script>

<template>
  <div class="px-2 py-4 max-w-200 mx-auto">
    <div class="px-2">
      <a-input-search
        v-model="naviGotoTarget"
        allow-clear
        :placeholder="search?.placeholder || '搜索'"
        @press-enter="naviGoto"
        @search="naviGoto"
      />
    </div>
    <div v-for="(bigCat, key) in nav" :key="key" class="flex my-3">
      <div
        class="flex items-center justify-center min-w-13 font-bold mr-2 border-r border-$color-border-2"
      >
        {{ key }}
      </div>
      <div class="flex flex-wrap">
        <div
          v-for="cat in bigCat"
          :key="cat.name"
          class="p-2.5 m-0.4 rounded-md cursor-pointer hover:bg-$color-fill-2"
          @click="open(cat.url)"
        >
          {{ cat.name }}
        </div>
      </div>
    </div>
  </div>
</template>
