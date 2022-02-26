<script setup lang="ts">
  import { webNav, liveUrlPrefix, videoUrlPrefix } from '@/utils/constant'
  import { ref } from 'vue'
  import { useAppStore } from '@/store'
  import { useRouter } from 'vue-router'
  import { resizeMainWindow } from '@/utils'

  const router = useRouter()
  const appStore = useAppStore()

  const open = async (url: string) => {
    try {
      let newUrl = url
      // 将链接中的${uid}替换为真正的值
      const variable = url.match(/\${\w+}/g)
      if (variable) {
        // 去重
        const newVariable = Array.from(new Set(variable))
        for (const value of newVariable) {
          if (value === '${uid}') {
            await window.app.getCookieValue('DedeUserID').then((uid) => {
              if (!uid) {
                throw new Error('请先登录！')
              }
              newUrl = newUrl.replaceAll('${uid}', uid)
            })
          }
        }
      }
      router.push({
        name: 'Home',
      })
      if (newUrl === appStore.webview.getURL()) {
        resizeMainWindow()
      } else {
        appStore.go(newUrl)
      }
    } catch (error: any) {
      alert(error.message)
    }
  }

  const naviGotoTarget = ref('')
  const naviGoto = () => {
    const value = naviGotoTarget.value
    // 包含bilibili.com的字符串和纯数字是合法的跳转目标
    if (value.startsWith('http') && value.indexOf('bilibili.com') >= 0) {
      // 直接输入url
      open(value)
      return
    }
    const lv = /^lv(\d+)$/.exec(value)
    if (lv) {
      // 直播
      open(liveUrlPrefix + lv[1])
    } else if (/^(\d+)$/.test(value)) {
      // 纯数字是av号
      open(videoUrlPrefix + 'av' + value)
    } else if (/^(av\d+)$/.test(value)) {
      // av号
      open(videoUrlPrefix + value)
    } else if (/^(BV\w+)$/.test(value)) {
      // BV号
      open(videoUrlPrefix + value)
    } else {
      open(`https://m.bilibili.com/search?keyword=${value}`)
    }
  }
</script>

<template>
  <div class="px-6 py-8 max-w-200 mx-auto">
    <div class="flex self-center mb-8 bg-gray-100 h-14 px-8 rounded-full">
      <input
        type="text"
        class="flex-1 bg-transparent mr-2"
        v-model="naviGotoTarget"
        placeholder="av号/BV号/lv直播/网址/关键词"
        @keydown.enter="naviGoto"
      />
      <button @click="naviGoto">搜索</button>
    </div>
    <div class="flex flex-col">
      <div v-for="(bigCat, key) in webNav" :key="key" class="flex mb-6">
        <div
          class="flex items-center justify-center min-w-20 font-bold mr-4 border-r border-r-gray-100"
          >{{ key }}</div
        >
        <div class="flex flex-wrap">
          <div
            v-for="cat in bigCat"
            :key="cat.name"
            class="p-2.5 m-0.5 rounded-md cursor-pointer hover:bg-gray-100"
            @click="open(cat.url)"
          >
            {{ cat.name }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
