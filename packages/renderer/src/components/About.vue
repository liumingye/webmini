<script setup lang="ts">
  const versions = window.app.versions
</script>

<template>
  <transition name="delayDisplayNone">
    <div class="about absolute w-full text-center select-none text-white">
      <div class="flex mx-auto max-w-140 pl-10">
        <div class="flex-1">
          <div class="w-15 mx-auto">
            <img class="w-full h-full" src="@/assets/images/icon.png" />
          </div>
          <p>bilimini</p>
          <p>藏起来！哔哩哔哩</p>
          <p>
            <a href="https://github.com/liumingye/bilimini" target="_blank">Github</a>
          </p>
        </div>
        <div class="flex-1">
          <div v-for="(value, key) in versions" :key="key" class="flex mt-2">
            <div class="mr-2">{{ key }}:</div>
            <div class="font-bold">{{ value }}</div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style lang="less" scoped>
  .delayDisplayNone-leave-active {
    transition: 0.2s;
  }
  .about {
    background: @color-bg-pink;
    margin-top: -150px;
    height: 150px;
    padding: 10px;
    line-height: 1.3em;

    p {
      margin-top: 8px;
    }
    a {
      color: #fff;
    }
  }
</style>
