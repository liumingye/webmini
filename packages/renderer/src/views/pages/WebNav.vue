<script setup lang="ts">
  import { webNav, liveUrlPrefix, videoUrlPrefix } from '@/config/constant'
  import { useAppStore } from '@/store'
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
            await window.app.cookies
              .get({ url: 'https://www.bilibili.com', name: 'DedeUserID' })
              .then((uid) => {
                if (uid.length === 0) {
                  throw new Error('请先登录！')
                }
                newUrl = newUrl.replaceAll('${uid}', uid[0].value)
              })
          }
        }
      }
      if (newUrl === appStore.webview.getURL()) {
        resizeMainWindow()
      } else {
        appStore.go(newUrl)
      }
      router.push({
        name: 'Home',
      })
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
  <div class="bg-$color-bg-2 px-2 py-4 max-w-200 mx-auto">
    <div class="px-2">
      <a-input-search
        v-model="naviGotoTarget"
        allow-clear
        placeholder="av号/BV号/lv直播/网址/关键词"
        @press-enter="naviGoto"
        @search="naviGoto"
      />
    </div>
    <div v-for="(bigCat, key) in webNav" :key="key" class="flex my-3">
      <div
        class="flex items-center justify-center min-w-13 font-bold mr-2 border-r border-$color-border-2"
        >{{ key }}</div
      >
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
