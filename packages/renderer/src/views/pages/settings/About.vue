<script setup lang="ts">
  import { IconGithub, IconBug } from '@arco-design/web-vue/es/icon'
  const versions = window.app.versions
</script>

<template>
  <div id="about" class="flex items-center flex-col">
    <div class="w-15 mx-auto">
      <img class="w-full h-full" src="@/assets/images/icon.png" />
    </div>
    <p class="font-bold my-4">webmini</p>
    <p class="link">
      <a href="https://github.com/liumingye/webmini" target="_blank">
        <IconGithub class="mr-1" />
        <span>Github</span>
      </a>
      <a href="https://github.com/liumingye/webmini/issues" target="_blank">
        <IconBug class="mr-1" />
        <span>报告问题</span>
      </a>
    </p>
    <div class="mt-5">
      <template v-for="(value, key) in versions" :key="key">
        <div class="justify-center mt-2 flex">
          <div class="mr-2">{{ key }}:</div>
          <div class="font-bold truncate">
            {{ value }}
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="less" scoped>
  .delayDisplayNone-leave-active {
    transition: 0.2s;
  }
  #about {
    padding: 20px 10px 10px;
    color: var(--theme-color-text);
    background: var(--theme-color-bg);

    p {
      margin-top: 8px;
    }
    .link {
      a {
        text-decoration: underline;
        &:not(:last-child)::after {
          margin: 0 4px;
          content: '|';
        }
      }
    }
  }
</style>
