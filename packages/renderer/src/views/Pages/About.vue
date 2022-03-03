<script setup lang="ts">
  const versions = window.app.versions
</script>

<template>
  <div id="about" class="text-center text-white">
    <div class="flex flex-col mx-auto max-w-150">
      <div class="w-15 mx-auto">
        <img class="w-full h-full" src="@/assets/images/icon.png" />
      </div>
      <p class="font-bold">bilimini</p>
      <p>迷你悬浮浏览器</p>
      <p class="link">
        <a href="https://github.com/liumingye/bilimini" target="_blank">Github</a>
        <a href="https://github.com/liumingye/bilimini/issues" target="_blank">报告问题</a>
      </p>
      <div class="mt-5">
        <template v-for="(value, key) in versions" :key="key">
          <div class="justify-center mt-2 flex">
            <div class="mr-2">{{ key }}:</div>
            <div class="font-bold truncate">{{ value }}</div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
  .delayDisplayNone-leave-active {
    transition: 0.2s;
  }
  #about {
    background: @color-app-bg;
    padding: 10px;

    p {
      margin-top: 8px;
    }
    .link {
      a {
        color: #fff;
        text-decoration: underline;
        &:not(:last-child)::after {
          content: '|';
          margin: 0 4px;
        }
      }
    }
  }
</style>
