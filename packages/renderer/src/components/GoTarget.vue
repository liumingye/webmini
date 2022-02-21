<script setup lang="ts">
  import { ref } from 'vue'
  import { useAppStore } from '@/store'
  import { liveUrlPrefix, videoUrlPrefix } from '@/utils/constant'

  const appStore = useAppStore()
  const naviGotoTarget = ref('')

  const naviGotoHide = () => {
    appStore.showGotoTarget = false
  }
  const naviGoto = () => {
    let lv
    const target = naviGotoTarget.value
    console.log(`路由：手动输入地址 ${target}`)
    // 包含bilibili.com的字符串和纯数字是合法的跳转目标
    if (target.startsWith('http') && target.indexOf('bilibili.com') > -1) {
      // 直接输入url
      appStore.go(target)
    } else if ((lv = /^lv(\d+)$/.exec(target))) {
      // 直播
      appStore.go(liveUrlPrefix + lv[1])
    } else if (/^(\d+)$/.test(target)) {
      // 纯数字是av号
      appStore.go(videoUrlPrefix + 'av' + target)
    } else if (/^(BV\w+)/.test(target)) {
      // BV号
      appStore.go(videoUrlPrefix + target)
    } else {
      // not a valid input
      alert('你确定输入的是b站链接或者av号吗？')
      return
    }
    naviGotoHide()
  }
</script>

<template>
  <div class="overlay" @click="naviGotoHide">
    <div id="layer" @click.stop>
      <input
        id="input"
        v-model="naviGotoTarget"
        type="text"
        placeholder="支持av号/BV号/网址"
        @keyup.enter="naviGoto"
      />
      <div id="finish" @click="naviGoto">确认</div>
    </div>
  </div>
</template>

<style lang="less" scoped>
  .overlay {
    display: flex;
    justify-content: center;
    align-items: center;
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    z-index: 10;

    #layer {
      display: flex;
      align-items: center;
      background: #f25d8e;
      border-radius: 4px;
      width: 100%;
      max-width: 200px;
      height: 45px;
      padding: 6px;
      #input {
        flex: 1;
        min-width: 0;
        border-radius: 4px;
        line-height: 30px;
        padding: 0 10px;
      }
      #finish {
        color: #dfc8cd;
        cursor: pointer;
        display: inline-block;
        padding: 0 10px;
        line-height: 30px;
        &:hover {
          color: #fff;
        }
      }
    }
  }
</style>
